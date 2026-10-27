"""Testes do parsing de salários (normalize.parse_salary).

Os textos vêm, quase todos, de vagas reais que estavam a gerar salários errados:
subsídios e prémios tratados como salário, e valores mensais misturados com anuais.

Correr a partir da raiz do repo:
    scraper/.venv/Scripts/python -m unittest discover -s scraper -p "test_*.py" -v
"""

import unittest

from normalize import normalize_jobs, parse_salary

NONE = (None, None, None, None)


class ParseSalaryRealPostings(unittest.TestCase):
    """Casos tirados das vagas que estavam na BD com o salário errado."""

    def test_monthly_range_without_period_word(self):
        # PrimeIT: sem "mês" escrito, mas o valor só faz sentido como mensal
        text = "Pacote Salarial & Benefícios: 1200€ a 2000€ (base) + SA + Flex Benefits"
        self.assertEqual(parse_salary(text), (1200.0, 2000.0, "EUR", "month"))

    def test_annual_range_with_period_word(self):
        # Castilho
        text = "Remuneração bruta anual entre 24.000 € e 36.000 €, em função da experiência, perfil e competências."
        self.assertEqual(parse_salary(text), (24000.0, 36000.0, "EUR", "year"))

    def test_ignores_allowances_and_referral_bonus(self):
        # Fresenius: o mínimo estava a ser o prémio de referência (1.500€)
        text = (
            "Salário e Incentivos Financeiros: Vencimento Base Anual, entre 21.350€ e 27.300€ "
            "Subsídio de alimentação 2.509,54€ anual Prémio anual correspondente a 1 mês de salário "
            "(pago mensalmente em 12 meses, de acordo com a assiduidade). Subsídio de Localização 1.800€ anual. "
            'Prémio "Recomende um Colega" de 1.500€, por cada contratação bem-sucedida de Enfermeiros.'
        )
        self.assertEqual(parse_salary(text), (21350.0, 27300.0, "EUR", "year"))

    def test_benefit_budgets_are_not_salary(self):
        # MVST: o orçamento de viagem (500€) estava a ser gravado como salário
        text = (
            "2 extra days off over the holidays (24.12 & 31.12). €500 travel budget to work from our "
            "Munich or Barcelona office. €1,500 annual learning budget + access to Udemy courses. "
            "€50 monthly top-up for lifestyle perks."
        )
        self.assertEqual(parse_salary(text), NONE)

    def test_monthly_base_range(self):
        # Diaverum
        text = "Vencimento base entre 1.654€ e 2.100€, de acordo com a experiência profissional. Seguro de saúde."
        self.assertEqual(parse_salary(text), (1654.0, 2100.0, "EUR", "month"))


class ParseSalaryBenefits(unittest.TestCase):

    def test_standalone_subsidy_is_not_salary(self):
        self.assertEqual(parse_salary("Subsídio de alimentação de 500€ por mês."), NONE)

    def test_amount_without_salary_word_or_period_is_ignored(self):
        self.assertEqual(parse_salary("A empresa investiu 2.000€ em formação no último ano."), NONE)

    def test_explicit_period_counts_without_salary_word(self):
        text = "Oferecemos 1.300€/mês + subsídio de alimentação."
        self.assertEqual(parse_salary(text), (1300.0, None, "EUR", "month"))


class ParseSalaryNumberFormats(unittest.TestCase):

    def test_english_thousands_separator(self):
        text = "Salary: €45,000 - €60,000 per year, plus bonus."
        self.assertEqual(parse_salary(text), (45000.0, 60000.0, "EUR", "year"))

    def test_decimal_comma(self):
        self.assertEqual(parse_salary("Salário base de 1.654,50€ por mês."), (1654.5, None, "EUR", "month"))

    def test_k_suffix_is_annual(self):
        text = "Salary range €30k–€40k depending on experience."
        self.assertEqual(parse_salary(text), (30000.0, 40000.0, "EUR", "year"))

    def test_range_with_currency_only_on_upper_bound(self):
        text = "Salário entre 1.500 e 1.800€ brutos mensais."
        self.assertEqual(parse_salary(text), (1500.0, 1800.0, "EUR", "month"))


class ParseSalaryNotComparable(unittest.TestCase):

    def test_daily_rate_is_ignored(self):
        self.assertEqual(parse_salary("Contractor daily rate: €600 per day."), NONE)

    def test_implausible_value_is_ignored(self):
        self.assertEqual(parse_salary("Volume de negócios anual de 12.000.000€."), NONE)

    def test_empty_text(self):
        self.assertEqual(parse_salary(None), NONE)
        self.assertEqual(parse_salary(""), NONE)


class NormalizeJobsSalaryPeriod(unittest.TestCase):

    def test_period_column_is_filled(self):
        from linkedin import ScrapedJob

        job = ScrapedJob(external_id="1", title="Backend Developer", company_name="X",
                         location_raw="Lisboa, Portugal", url="https://x/1",
                         description="Salário: 1.500€ por mês. Regime híbrido.")
        df = normalize_jobs([job], "tecnologia")
        self.assertEqual(df.loc[0, "salary_min"], 1500.0)
        self.assertEqual(df.loc[0, "salary_period"], "month")


if __name__ == "__main__":
    unittest.main()
