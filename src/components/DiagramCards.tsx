/**
 * 6 张高分必备标准 SVG 可视化图卡（适配浅色/深色主题）
 */

export default function DiagramCards() {
  return (
    <div className="diagram-list">
      {/* 1. 挣值分析 S 曲线 */}
      <article className="diagram-card">
        <h3>1. 挣值管理（EVM）S 曲线与偏差预测</h3>
        <p className="diagram-caption">论文高频画图点（2024 成本论文真题）：PV 基准、AC 实际超支、EV 滞后与 EAC 预测</p>
        <svg viewBox="0 0 360 210" className="diagram-svg" role="img" aria-label="挣值分析 S 曲线示意图">
          <line x1="42" y1="175" x2="338" y2="175" stroke="currentColor" strokeOpacity="0.4" strokeWidth="1.5" />
          <line x1="42" y1="20" x2="42" y2="175" stroke="currentColor" strokeOpacity="0.4" strokeWidth="1.5" />
          {/* 检查时点虚线 */}
          <line x1="185" y1="25" x2="185" y2="175" stroke="var(--text-light)" strokeDasharray="4 4" strokeWidth="1" />
          <text x="185" y="192" textAnchor="middle" fontSize="10" fill="var(--text-secondary)">当前检查时点</text>
          {/* BAC 水平线 */}
          <line x1="42" y1="62" x2="295" y2="62" stroke="var(--primary)" strokeDasharray="3 3" strokeOpacity="0.5" />
          <text x="298" y="65" fontSize="10" fontWeight="600" fill="var(--primary)">BAC</text>
          {/* PV 曲线 */}
          <path d="M 42 175 C 110 168, 160 120, 295 62" fill="none" stroke="var(--blue)" strokeWidth="2.4" />
          <text x="255" y="88" fontSize="11" fontWeight="600" fill="var(--blue)">PV (计划)</text>
          {/* AC 曲线 + EAC 预测虚线 */}
          <path d="M 42 175 C 100 162, 145 110, 185 95" fill="none" stroke="var(--danger)" strokeWidth="2.4" />
          <path d="M 185 95 Q 250 52, 315 34" fill="none" stroke="var(--danger)" strokeWidth="2" strokeDasharray="5 4" />
          <circle cx="315" cy="34" r="3.5" fill="var(--danger)" />
          <text x="318" y="32" fontSize="10" fontWeight="700" fill="var(--danger)">EAC</text>
          <text x="150" y="92" fontSize="11" fontWeight="600" fill="var(--danger)">AC</text>
          {/* EV 曲线 */}
          <path d="M 42 175 C 105 170, 148 145, 185 130" fill="none" stroke="var(--primary)" strokeWidth="2.6" />
          <text x="150" y="148" fontSize="11" fontWeight="700" fill="var(--primary)">EV</text>
          {/* CV / SV 标注 */}
          <circle cx="185" cy="95" r="3" fill="var(--danger)" />
          <circle cx="185" cy="112" r="3" fill="var(--blue)" />
          <circle cx="185" cy="130" r="3" fill="var(--primary)" />
          <text x="193" y="114" fontSize="10" fill="var(--danger)">CV = EV−AC &lt; 0</text>
          <text x="193" y="128" fontSize="10" fill="var(--orange)">SV = EV−PV &lt; 0</text>
          <text x="16" y="28" fontSize="10" fill="var(--text-secondary)">成本</text>
          <text x="326" y="190" fontSize="10" fill="var(--text-secondary)">时间</text>
        </svg>
      </article>

      {/* 2. 单代号六标时格 */}
      <article className="diagram-card">
        <h3>2. 单代号网络图（PDM）六标时法</h3>
        <p className="diagram-caption">顺推取最大（汇合点），逆推取最小（分支点），总浮动 TF = LS − ES = LF − EF</p>
        <svg viewBox="0 0 360 155" className="diagram-svg" role="img" aria-label="单代号六标时节点图">
          <rect x="65" y="18" width="230" height="106" rx="10" fill="var(--surface-muted)" stroke="var(--primary)" strokeWidth="2" />
          <line x1="65" y1="53" x2="295" y2="53" stroke="var(--border)" strokeWidth="1.5" />
          <line x1="65" y1="88" x2="295" y2="88" stroke="var(--border)" strokeWidth="1.5" />
          <line x1="142" y1="18" x2="142" y2="53" stroke="var(--border)" strokeWidth="1.5" />
          <line x1="218" y1="18" x2="218" y2="53" stroke="var(--border)" strokeWidth="1.5" />
          <line x1="142" y1="88" x2="142" y2="124" stroke="var(--border)" strokeWidth="1.5" />
          <line x1="218" y1="88" x2="218" y2="124" stroke="var(--border)" strokeWidth="1.5" />

          <text x="103" y="40" textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--blue)">ES 最早开始</text>
          <text x="180" y="40" textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--text)">DU 工期</text>
          <text x="256" y="40" textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--blue)">EF 最早完成</text>

          <text x="180" y="75" textAnchor="middle" fontSize="14" fontWeight="700" fill="var(--primary)">活动名称（如：活动 D）</text>

          <text x="103" y="110" textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--orange)">LS 最晚开始</text>
          <text x="180" y="110" textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--danger)">TF 总浮动</text>
          <text x="256" y="110" textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--orange)">LF 最晚完成</text>

          <text x="180" y="144" textAnchor="middle" fontSize="10.5" fill="var(--text-secondary)">
            EF = ES + DU　｜　LS = LF − DU　｜　FF = min(紧后 ES) − EF
          </text>
        </svg>
      </article>

      {/* 3. 整体变更控制 8 步闭环 */}
      <article className="diagram-card">
        <h3>3. 实施整体变更控制闭环流程</h3>
        <p className="diagram-caption">案例找茬与论文最常考主线：书面申请 → 影响分析 → CCB 审批 → 通知实施 → 验证更新</p>
        <svg viewBox="0 0 360 155" className="diagram-svg" role="img" aria-label="整体变更控制流程图">
          {[
            { x: 12, y: 18, t: '1.书面申请', s: '记入变更日志', c: 'var(--blue)' },
            { x: 100, y: 18, t: '2.初审评估', s: '范围/进度/成本', c: 'var(--blue)' },
            { x: 188, y: 18, t: '3.CCB审批', s: '批准/否决/推迟', c: 'var(--danger)' },
            { x: 276, y: 18, t: '4.通知干系人', s: '同步审批结论', c: 'var(--orange)' },
          ].map((b, i) => (
            <g key={b.t}>
              <rect x={b.x} y={b.y} width="76" height="44" rx="8" fill="var(--surface-muted)" stroke={b.c} strokeWidth="1.6" />
              <text x={b.x + 38} y={b.y + 19} textAnchor="middle" fontSize="10.5" fontWeight="700" fill={b.c}>{b.t}</text>
              <text x={b.x + 38} y={b.y + 34} textAnchor="middle" fontSize="9" fill="var(--text-secondary)">{b.s}</text>
              {i < 3 && <path d={`M ${b.x + 76} ${b.y + 22} L ${b.x + 88} ${b.y + 22}`} stroke="var(--text-light)" strokeWidth="1.5" markerEnd="none" />}
            </g>
          ))}
          <path d="M 314 62 L 314 88" stroke="var(--text-light)" strokeWidth="1.5" />
          {[
            { x: 276, y: 88, t: '5.组织实施', s: '受控库检出', c: 'var(--primary)' },
            { x: 188, y: 88, t: '6.监控验证', s: '控制质量确认', c: 'var(--primary)' },
            { x: 100, y: 88, t: '7.更新基准', s: '计划与文件同步', c: 'var(--primary)' },
            { x: 12, y: 88, t: '8.归档总结', s: '经验教训沉淀', c: 'var(--purple)' },
          ].map((b, i) => (
            <g key={b.t}>
              <rect x={b.x} y={b.y} width="76" height="44" rx="8" fill="var(--surface-muted)" stroke={b.c} strokeWidth="1.6" />
              <text x={b.x + 38} y={b.y + 19} textAnchor="middle" fontSize="10.5" fontWeight="700" fill={b.c}>{b.t}</text>
              <text x={b.x + 38} y={b.y + 34} textAnchor="middle" fontSize="9" fill="var(--text-secondary)">{b.s}</text>
              {i < 3 && <path d={`M ${b.x} ${b.y + 22} L ${b.x - 12} ${b.y + 22}`} stroke="var(--text-light)" strokeWidth="1.5" />}
            </g>
          ))}
          <text x="180" y="148" textAnchor="middle" fontSize="10" fill="var(--text-secondary)">紧急变更须按预先批准的紧急授权流程处置，事后补全评审与记录</text>
        </svg>
      </article>

      {/* 4. 权力/利益方格 */}
      <article className="diagram-card">
        <h3>4. 干系人权力 / 利益方格</h3>
        <p className="diagram-caption">纵轴权力、横轴利益：高权高利重点管理，高权低利令其满意，低权高利随时告知，低权低利监督</p>
        <svg viewBox="0 0 360 185" className="diagram-svg" role="img" aria-label="权力利益方格">
          <rect x="64" y="16" width="132" height="68" rx="8" fill="var(--practice-bg)" stroke="var(--orange)" strokeWidth="1.5" />
          <text x="130" y="45" textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--orange)">令其满意</text>
          <text x="130" y="64" textAnchor="middle" fontSize="10" fill="var(--text-secondary)">高权力 · 低利益（如法务/审计）</text>

          <rect x="204" y="16" width="132" height="68" rx="8" fill="var(--danger-light)" stroke="var(--danger)" strokeWidth="1.8" />
          <text x="270" y="45" textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--danger)">重点管理</text>
          <text x="270" y="64" textAnchor="middle" fontSize="10" fill="var(--text-secondary)">高权力 · 高利益（如发起人/客户）</text>

          <rect x="64" y="92" width="132" height="68" rx="8" fill="var(--surface-muted)" stroke="var(--border)" strokeWidth="1.5" />
          <text x="130" y="121" textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--text-secondary)">监督</text>
          <text x="130" y="140" textAnchor="middle" fontSize="10" fill="var(--text-secondary)">低权力 · 低利益（投入最少精力）</text>

          <rect x="204" y="92" width="132" height="68" rx="8" fill="var(--primary-light)" stroke="var(--primary)" strokeWidth="1.5" />
          <text x="270" y="121" textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--primary)">随时告知</text>
          <text x="270" y="140" textAnchor="middle" fontSize="10" fill="var(--text-secondary)">低权力 · 高利益（如一线用户）</text>

          <text x="30" y="55" textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--text)">高权力</text>
          <text x="30" y="130" textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--text-secondary)">低权力</text>
          <text x="130" y="177" textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--text-secondary)">低利益</text>
          <text x="270" y="177" textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--text)">高利益</text>
        </svg>
      </article>

      {/* 5. 质量成本 COQ 结构 */}
      <article className="diagram-card">
        <h3>5. 质量成本（COQ）分类结构</h3>
        <p className="diagram-caption">预防胜于检查：一致性成本（主动投入）远低于非一致性成本（返工、保修、声誉损失）</p>
        <svg viewBox="0 0 360 170" className="diagram-svg" role="img" aria-label="质量成本分类图">
          <rect x="125" y="10" width="110" height="30" rx="8" fill="var(--primary)" />
          <text x="180" y="29" textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--on-primary)">质量成本 COQ</text>

          <path d="M 155 40 L 95 62 M 205 40 L 265 62" stroke="var(--text-light)" strokeWidth="1.5" />

          <rect x="18" y="62" width="154" height="96" rx="10" fill="var(--primary-light)" stroke="var(--primary)" strokeWidth="1.5" />
          <text x="95" y="82" textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--primary)">一致性成本（避免失败）</text>
          <text x="95" y="103" textAnchor="middle" fontSize="10.5" fill="var(--text)">• 预防成本：培训、流程、设备</text>
          <text x="95" y="122" textAnchor="middle" fontSize="10.5" fill="var(--text)">• 评价成本：测试、检查、审计</text>
          <text x="95" y="142" textAnchor="middle" fontSize="9.5" fill="var(--text-secondary)">项目期间主动投入</text>

          <rect x="188" y="62" width="154" height="96" rx="10" fill="var(--danger-light)" stroke="var(--danger)" strokeWidth="1.5" />
          <text x="265" y="82" textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--danger)">非一致性成本（处理失败）</text>
          <text x="265" y="103" textAnchor="middle" fontSize="10.5" fill="var(--text)">• 内部失败：返工、报废</text>
          <text x="265" y="122" textAnchor="middle" fontSize="10.5" fill="var(--text)">• 外部失败：保修、索赔、流失</text>
          <text x="265" y="142" textAnchor="middle" fontSize="9.5" fill="var(--text-secondary)">客户发现代价最高</text>
        </svg>
      </article>

      {/* 6. 配置管理三库与版本号 */}
      <article className="diagram-card">
        <h3>6. 配置管理三库流转与第 4 版版本号规则</h3>
        <p className="diagram-caption">硬性考点：草稿 0.YZ · 正式 X.Y · 修改 X.YZ（单小数点，非 X.Y.Z）</p>
        <svg viewBox="0 0 360 140" className="diagram-svg" role="img" aria-label="配置管理三库流转图">
          <rect x="12" y="20" width="96" height="68" rx="10" fill="var(--surface-muted)" stroke="var(--blue)" strokeWidth="1.6" />
          <text x="60" y="42" textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--blue)">开发库（动态）</text>
          <text x="60" y="59" textAnchor="middle" fontSize="10" fill="var(--text)">开发人员读写</text>
          <text x="60" y="75" textAnchor="middle" fontSize="10" fontWeight="600" fill="var(--blue)">草稿 0.YZ</text>

          <path d="M 108 54 L 130 54" stroke="var(--text-light)" strokeWidth="1.8" />

          <rect x="132" y="20" width="96" height="68" rx="10" fill="var(--primary-light)" stroke="var(--primary)" strokeWidth="1.8" />
          <text x="180" y="42" textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--primary)">受控库（基线）</text>
          <text x="180" y="59" textAnchor="middle" fontSize="10" fill="var(--text)">CMO 管控入库</text>
          <text x="180" y="75" textAnchor="middle" fontSize="10" fontWeight="600" fill="var(--primary)">正式 X.Y / 改 X.YZ</text>

          <path d="M 228 54 L 250 54" stroke="var(--text-light)" strokeWidth="1.8" />

          <rect x="252" y="20" width="96" height="68" rx="10" fill="var(--practice-bg)" stroke="var(--orange)" strokeWidth="1.6" />
          <text x="300" y="42" textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--orange)">产品库（静态）</text>
          <text x="300" y="59" textAnchor="middle" fontSize="10" fill="var(--text)">最终交付发行版</text>
          <text x="300" y="75" textAnchor="middle" fontSize="10" fontWeight="600" fill="var(--orange)">只读 · 严禁直改</text>

          <text x="180" y="114" textAnchor="middle" fontSize="10.5" fill="var(--text)">
            修改流程：正式 1.2 → 批准检出修改 1.21 → 1.22 → 评审入库 Z 清零 → 1.3 或 2.0
          </text>
        </svg>
      </article>
    </div>
  )
}
