const STEPS = [
  {
    title: 'Juntamos as vagas',
    body: 'Todos os dias reunimos as vagas publicadas na internet num só lugar, organizadas por área de trabalho e sem duplicados.',
  },
  {
    title: 'Escolhes o que procuras',
    body: 'Filtras por área, localização, tipo de contrato e pelo que sabes fazer. Só aparecem opções que existem de facto.',
  },
  {
    title: 'Candidatas-te com confiança',
    body: 'Vês apenas vagas ainda abertas, das mais recentes para as mais antigas. Sem perder tempo com vagas já fechadas.',
  },
];

export default function HowItWorks() {
  return (
    <section className="page-section">
      <p className="eyebrow">Como funciona</p>
      <h2 className="section-title" style={{ marginBottom: 72 }}>
        Três passos.<br />Zero vagas fechadas.
      </h2>

      <ol className="steps">
        {STEPS.map((step, i) => (
          <li key={step.title} className="step">
            <span className="step-num">{i + 1}</span>
            <h3 className="step-title">{step.title}</h3>
            <p className="step-body">{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
