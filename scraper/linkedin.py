"""Scraping de vagas do LinkedIn via listagem pública (sem login).

Dada uma query, extrai: external_id, título, empresa, localização, URL e,
opcionalmente, o texto da vaga + senioridade/tipo de contrato em bruto.
A normalização destes campos é feita depois, no passo de Pandas — este
módulo devolve os dados tal como aparecem na fonte.

Uso como script (a partir da raiz do repo):
    scraper/.venv/Scripts/python scraper/linkedin.py --query "java spring boot" --limit 5

Notas:
- usa o endpoint guest de listagem (25 resultados por página) e as páginas
  públicas de vaga; sem login, sem cookies
- pausas aleatórias entre pedidos para não abusar da fonte
- se o LinkedIn responder com a parede de login (authwall), a vaga fica sem
  descrição em vez de falhar a execução
"""

from __future__ import annotations

import argparse
import random
import re
import time
from dataclasses import dataclass, field
from urllib.parse import urlencode

from playwright.sync_api import Page, TimeoutError as PlaywrightTimeout, sync_playwright

SOURCE = "linkedin"
GUEST_SEARCH = "https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search"
JOB_VIEW = "https://www.linkedin.com/jobs/view/{job_id}"
PAGE_SIZE = 25
URN_RE = re.compile(r"urn:li:jobPosting:(\d+)")

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
)


@dataclass
class ScrapedJob:
    """Uma vaga tal como veio da fonte, sem normalização."""

    external_id: str
    title: str
    company_name: str
    location_raw: str
    url: str
    description: str | None = None
    seniority_raw: str | None = None
    contract_type_raw: str | None = None
    source: str = field(default=SOURCE)


def _pause(low: float = 2.0, high: float = 4.5) -> None:
    time.sleep(random.uniform(low, high))


def _card_text(card, selector: str) -> str:
    loc = card.locator(selector)
    return loc.first.inner_text().strip() if loc.count() else ""


def _parse_cards(page: Page) -> list[ScrapedJob]:
    jobs: list[ScrapedJob] = []
    for card in page.locator("div.base-card").all():
        match = URN_RE.search(card.get_attribute("data-entity-urn") or "")
        if not match:
            continue
        job_id = match.group(1)
        jobs.append(
            ScrapedJob(
                external_id=job_id,
                title=_card_text(card, "h3.base-search-card__title"),
                company_name=_card_text(card, "h4.base-search-card__subtitle"),
                location_raw=_card_text(card, "span.job-search-card__location"),
                url=JOB_VIEW.format(job_id=job_id),  # URL canónico, sem parâmetros de tracking
            )
        )
    return jobs


def search_jobs(page: Page, query: str, location: str, limit: int) -> list[ScrapedJob]:
    """Percorre a listagem pública até `limit` vagas (paginada de 25 em 25)."""
    results: list[ScrapedJob] = []
    for start in range(0, limit, PAGE_SIZE):
        params = urlencode({"keywords": query, "location": location, "start": start})
        page.goto(f"{GUEST_SEARCH}?{params}", timeout=30_000)
        batch = _parse_cards(page)
        if not batch:  # fim dos resultados (ou resposta vazia por rate limit)
            break
        results.extend(batch)
        if len(results) >= limit:
            break
        _pause()

    seen: set[str] = set()
    unique = [j for j in results if not (j.external_id in seen or seen.add(j.external_id))]
    return unique[:limit]


def fetch_details(page: Page, job: ScrapedJob) -> bool:
    """Preenche description/seniority_raw/contract_type_raw. False se a página não abriu."""
    page.goto(job.url, timeout=30_000)
    if "authwall" in page.url or "/login" in page.url:
        return False

    markup = page.locator("div.show-more-less-html__markup")
    try:
        markup.first.wait_for(timeout=10_000)
    except PlaywrightTimeout:
        return False
    job.description = markup.first.inner_text().strip()

    for item in page.locator("li.description__job-criteria-item").all():
        header = item.locator("h3").first.inner_text().strip().lower()
        value = item.locator("span").first.inner_text().strip()
        if "seniority" in header or "experiência" in header:
            job.seniority_raw = value
        elif "employment" in header or "emprego" in header:
            job.contract_type_raw = value
    return True


def scrape_query(
    query: str, location: str, limit: int, with_details: bool = True, headless: bool = True
) -> list[ScrapedJob]:
    """Execução completa de uma query: listagem + detalhes de cada vaga."""
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=headless)
        context = browser.new_context(user_agent=USER_AGENT, locale="pt-PT")
        page = context.new_page()

        jobs = search_jobs(page, query, location, limit)
        if with_details:
            for job in jobs:
                _pause()
                fetch_details(page, job)

        browser.close()
    return jobs


def main() -> None:
    parser = argparse.ArgumentParser(description="Scraping de teste de uma query do LinkedIn")
    parser.add_argument("--query", required=True)
    parser.add_argument("--location", default=None, help="por omissão vem do queries.yml")
    parser.add_argument("--limit", type=int, default=10)
    parser.add_argument("--no-details", action="store_true", help="só a listagem, sem abrir cada vaga")
    parser.add_argument("--headed", action="store_true", help="abrir o browser visível (debug)")
    args = parser.parse_args()

    location = args.location
    if location is None:
        from queries import load_config

        location = load_config().location

    jobs = scrape_query(
        args.query, location, args.limit,
        with_details=not args.no_details, headless=not args.headed,
    )

    print(f"\n{len(jobs)} vagas para '{args.query}' em {location}:\n")
    for job in jobs:
        print(f"[{job.external_id}] {job.title}")
        print(f"   empresa: {job.company_name} | local: {job.location_raw}")
        print(f"   url: {job.url}")
        if job.seniority_raw or job.contract_type_raw:
            print(f"   senioridade: {job.seniority_raw} | contrato: {job.contract_type_raw}")
        if job.description:
            resumo = " ".join(job.description.split())[:120]
            print(f"   descrição ({len(job.description)} chars): {resumo}…")
        print()


if __name__ == "__main__":
    main()
