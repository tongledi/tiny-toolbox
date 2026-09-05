import { tools } from '@/lib/tools';
export default function Home() {
  return (
    <div className="tool-home">
      <section className="home-intro" aria-labelledby="home-title">
        <span className="eyebrow">TINY TOOLBOX</span>
        <h1 id="home-title">小事，顺手解决。</h1>
        <p>为日常的小纠结，准备一点小帮手。</p>
        <div className="home-principles">
          <span>无需注册</span>
          <span>手机也好用</span>
          <span>内容保留在浏览器</span>
        </div>
      </section>
      <section aria-labelledby="tools-title">
        <div className="catalog-heading">
          <h2 id="tools-title">
            全部工具 <span>{tools.length.toString().padStart(2, '0')}</span>
          </h2>
          <p>选一个，直接开始。</p>
        </div>
        <div className="tool-grid">
          {tools.map((tool) => (
            <a key={tool.slug} className="tool-card" href={tool.href}>
              <div className="card-top">
                <span className="tool-symbol" aria-hidden="true">
                  {tool.symbol}
                </span>
                <span className="category">{tool.category}</span>
              </div>
              <h3>{tool.name}</h3>
              <p>{tool.description}</p>
              <ul className="tool-details">
                {tool.details.map((detail) => (
                  <li key={detail}>{detail}</li>
                ))}
              </ul>
              <div className="card-action">
                打开工具 <span aria-hidden="true">↗</span>
              </div>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
