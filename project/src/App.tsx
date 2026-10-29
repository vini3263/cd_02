import { useState, useEffect, useCallback, useRef } from "react"
import { useSoundEffects } from './hooks/useSoundEffects';

type GameState =
  | "MENU"
  | "INSTRUCTIONS"
  | "BRIEFING"
  | "INCOMING"
  | "ACTIVE"
  | "FEEDBACK"
  | "GAME_OVER"
  | "WIN"
type Decision = "FIRE" | "SAMU" | "PM" | "GM" | "DENY"
type FireUnit = "ABTR" | "SIATE"

interface FleetUnitStatus {
  total: number
  returnAfter: number[]
}

interface FleetStatus {
  ABTR: FleetUnitStatus
  SIATE: FleetUnitStatus
}

interface Scenario {
  id: number
  callerVoice: string
  incomingSnippet: string
  location: string
  nature: string
  victims: string
  transcript: string
  correctDecision: Decision
  requiredUnits?: FireUnit[]
  requiredCode?: 1 | 2
  moraleEffect: { correct: number; wrong: number }
  conductEffect: { correct: number; wrong: number }
  feedback: { correct: string; wrong: string }
}

const SCENARIOS: Scenario[] = [
  {
    id: 1,
    callerVoice: "Voz de Homem",
    incomingSnippet: '"Carro capotado, fogo na fiação..."',
    location: "Rua das Palmeiras, 450 – Maringá",
    nature: "Acidente com Vítima Presa + Princípio de Incêndio",
    victims: "1 confirmada – presa nas ferragens",
    transcript:
      "Motorista em pânico. Veículo capotado com princípio de incêndio na fiação elétrica. Vítima inconsciente presa nas ferragens. Cheiro forte de combustível. Rua das Palmeiras, 450.",
    correctDecision: "FIRE",
    requiredUnits: ["ABTR", "SIATE"],
    requiredCode: 2,
    moraleEffect: { correct: 5, wrong: -20 },
    conductEffect: { correct: 5, wrong: -30 },
    feedback: {
      correct:
        "Guarnição chegou em 4 minutos. Vítima resgatada com sucesso antes da ignição total. Incêndio controlado. Excelente julgamento.",
      wrong:
        "Chegada em Código 1 demorou 22 minutos. O veículo explodiu. Vítima em estado crítico. Falha grave registrada no prontuário.",
    },
  },
  {
    id: 2,
    callerVoice: "Voz de Mulher",
    incomingSnippet:
      '"Socorro! Fogo no restaurante da Av. Colombo! Tem muita fumaça!"',
    location: "Av. Colombo, 123 – Maringá",
    nature: "Incêndio Estrutural – Restaurante",
    victims: "Confirmar – possíveis clientes no interior",
    transcript:
      "Solicitante em pânico. Chamas visíveis pela fachada. Fumaça densa. Afirma que ainda há pessoas dentro do estabelecimento. Av. Colombo, 123.",
    correctDecision: "FIRE",
    requiredUnits: ["ABTR"],
    requiredCode: 2,
    moraleEffect: { correct: 5, wrong: -25 },
    conductEffect: { correct: 5, wrong: -35 },
    feedback: {
      correct:
        "Equipe chegou em tempo crítico. Incêndio controlado. Todos os clientes evacuados. Dano mínimo à estrutura.",
      wrong:
        "O restaurante na Av. Colombo foi reduzido a cinzas. A ajuda chegou tarde demais. Todos os pedidos foram perdidos. Conduta questionada.",
    },
  },
  {
    id: 3,
    callerVoice: "Voz de Adolescente",
    incomingSnippet: '"Oi, é só pra testar se o número funciona mesmo..."',
    location: "Não informada",
    nature: "Suspeita de Trote",
    victims: "Nenhuma",
    transcript:
      'Tom jovial, risadas ao fundo. Sem endereço quando questionado. Alega estar "testando". Sem ocorrência verificável. Número bloqueado em consulta.',
    correctDecision: "DENY",
    moraleEffect: { correct: 5, wrong: -15 },
    conductEffect: { correct: 5, wrong: -20 },
    feedback: {
      correct:
        "Trote identificado. Registro feito para rastreamento judicial. Guarnição preservada para ocorrências reais.",
      wrong:
        "Viatura despachada sem localização. 40 minutos perdidos. Ocorrência real aconteceu na mesma janela sem cobertura.",
    },
  },
  {
    id: 4,
    callerVoice: "Voz de Homem Idoso",
    incomingSnippet: '"Tem uma fumaçinha saindo da janela do vizinho..."',
    location: "Rua Independência, 78 – Maringá",
    nature: "Suspeita de Incêndio Residencial – Sem Chamas Visíveis",
    victims: "Nenhuma confirmada",
    transcript:
      "Vizinho calmo. Leve fumaça pela janela lateral. Sem chamas. Sem barulho. Mora ao lado há 20 anos. Pode ser churrasco. Sem sinais de pânico.",
    correctDecision: "FIRE",
    requiredUnits: ["ABTR"],
    requiredCode: 1,
    moraleEffect: { correct: 5, wrong: -15 },
    conductEffect: { correct: 5, wrong: -15 },
    feedback: {
      correct:
        "Guarnição chegou em Código 1, sem alarde. Era fumaça de churrasco no quintal. Vizinhança tranquilizada.",
      wrong:
        "Código 2 para churrasco de domingo. Sirene perturbou o bairro. Guarnição irritada. Moral em queda.",
    },
  },
  {
    id: 5,
    callerVoice: "Voz Modificada / Distorcida",
    incomingSnippet:
      '"Grande incêndio na Refinaria do Sul! Vai explodir tudo!"',
    location: '"Refinaria do Sul" – endereço não localizado no mapa',
    nature: "Suspeita de Trote Elaborado",
    victims: "Não confirmadas",
    transcript:
      "Voz distorcida por aplicativo. Relata explosão iminente em refinaria inexistente. Endereço não encontrado em nenhum registro cartográfico. Número VoIP descartável. Sem callback válido.",
    correctDecision: "DENY",
    moraleEffect: { correct: 5, wrong: -20 },
    conductEffect: { correct: 5, wrong: -25 },
    feedback: {
      correct:
        'Trote sofisticado neutralizado. A "Refinaria do Sul" não existe nos mapas. Três viaturas preservadas.',
      wrong:
        "Três viaturas enviadas para endereço inexistente. Sistema colapsou. Incêndio real no Jardim Alvorada sem cobertura por 1 hora.",
    },
  },
  {
    id: 6,
    callerVoice: "Voz de Mulher Calma",
    incomingSnippet: '"Tem uma pessoa desmaiada na calçada aqui..."',
    location: "Praça da República – Centro, Maringá",
    nature: "Emergência Médica – Pessoa Inconsciente",
    victims: "1 confirmada",
    transcript:
      "Testemunha calma. Pedestre caído na calçada, sem resposta. Lábios levemente arroxeados. Sem ferimentos externos. Praça da República, próximo ao banco.",
    correctDecision: "SAMU",
    moraleEffect: { correct: 5, wrong: -20 },
    conductEffect: { correct: 5, wrong: -30 },
    feedback: {
      correct:
        "SAMU e guarnição chegaram em 6 minutos. Paciente estabilizado. Era infarto fulminante – cada minuto era vital.",
      wrong:
        "Resposta lenta para emergência médica crítica. Paciente evoluiu a óbito antes da chegada da equipe. Conduta gravemente comprometida.",
    },
  },
  {
    id: 7,
    callerVoice: "Voz de Testemunha",
    incomingSnippet: '"Uma moto bateu no poste. O rapaz está ferido, mas consciente."',
    location: "Av. Mandacaru, 980 – Maringá",
    nature: "Acidente de Trânsito com Trauma",
    victims: "1 confirmada – trauma em membro inferior",
    transcript:
      "Motociclista consciente após colisão contra poste. Sangramento controlável na perna, sem fogo ou vítima presa. Trânsito parcialmente bloqueado.",
    correctDecision: "FIRE",
    requiredUnits: ["SIATE"],
    requiredCode: 2,
    moraleEffect: { correct: 5, wrong: -15 },
    conductEffect: { correct: 5, wrong: -20 },
    feedback: {
      correct:
        "Ambulância SIATE chegou rapidamente, imobilizou a vítima e realizou o transporte ao hospital.",
      wrong:
        "Recurso inadequado acionado. A vítima aguardou atendimento especializado e apresentou piora do quadro.",
    },
  },
  {
    id: 8,
    callerVoice: "Voz de Servidor Municipal",
    incomingSnippet: '"Estão quebrando os bancos e pichando o monumento da praça."',
    location: "Praça Raposo Tavares – Centro, Maringá",
    nature: "Vandalismo em Patrimônio Público",
    victims: "Nenhuma confirmada",
    transcript:
      "Grupo danificando bancos, lixeiras e um monumento municipal. Sem armas vistas. Os autores ainda estão na praça.",
    correctDecision: "GM",
    moraleEffect: { correct: 5, wrong: -15 },
    conductEffect: { correct: 5, wrong: -20 },
    feedback: {
      correct:
        "Guarda Municipal chegou ao local, conteve o vandalismo e preservou o patrimônio público.",
      wrong:
        "O órgão incorreto foi acionado. Os autores deixaram o local antes da chegada do apoio adequado.",
    },
  },
  {
    id: 9,
    callerVoice: "Voz de Comerciante",
    incomingSnippet: '"Tem uma briga generalizada e um homem ameaçando os outros!"',
    location: "Rua Neo Alves Martins, 2100 – Maringá",
    nature: "Briga Generalizada / Ameaça",
    victims: "Possíveis feridos – não confirmado",
    transcript:
      "Cinco pessoas envolvidas em briga na frente de um comércio. Uma delas ameaça os demais com um objeto metálico. Situação ainda em andamento.",
    correctDecision: "PM",
    moraleEffect: { correct: 5, wrong: -20 },
    conductEffect: { correct: 5, wrong: -25 },
    feedback: {
      correct:
        "Polícia Militar chegou, conteve os envolvidos e apreendeu o objeto usado na ameaça.",
      wrong:
        "A ocorrência policial foi encaminhada ao órgão errado. A agressão continuou e deixou feridos.",
    },
  },
]

const BRIEFING_TEXT = `TURNO 07:00 – COBOM – BATALHÃO DE MARINGÁ

Bom dia, Operador.

Você assume agora o controle da central de operações.
As seguintes viaturas estão de prontidão:

  ▸ ABT-01 (Autobomba)        — DISPONÍVEL
  ▸ ABT-02 (Autobomba)        — DISPONÍVEL
  ▸ APT-01 (Auto Plataforma)  — MANUTENÇÃO
  ▸ ABTR-01 (Tanque-Resgate) — DISPONÍVEL

PROTOCOLOS DE DESPACHO:

  193 / ABTR  → Incêndio e resgate pesado.
  193 / SIATE → Trauma e atendimento pré-hospitalar.
  192 / SAMU  → Emergência clínica e mal súbito.
  190 / PM    → Crime, agressão ou ameaça.
  153 / GM    → Patrimônio, postura e apoio municipal.

  CÓDIGO 1 → Deslocamento normal, sem sirene.
  CÓDIGO 2 → Emergência, vítimas em risco ou incêndio.

Identifique trotes antes de despachar.
Controle a frota: viaturas retornam após 2 chamadas.
Despache incorretamente e responda ao Comandante.

Boa sorte. Você vai precisar.

[ ENTER / CLIQUE PARA INICIAR O TURNO ]`

// ── image imports (Vite resolves these at build time) ──
import bgIncoming from "./assets/scene-incoming.jpg"
import bgActive from "./assets/scene-active.jpg"
import bgActiveStressed from "./assets/scene-active-stressed.jpg"
import bgBriefing from "./assets/scene-briefing.jpg"
import bgFeedbackSuccess from "./assets/scene-feedback-success.jpg"
import bgGameOver from "./assets/scene-gameover.jpg"

const createInitialFleet = (): FleetStatus => ({
  ABTR: { total: 2, returnAfter: [] },
  SIATE: { total: 2, returnAfter: [] },
})

const getDecisionTime = (scenarioIndex: number) =>
  Math.max(20, 45 - scenarioIndex * 3)

// ── Stat bar ──────────────────────────────────────────
function StatBar({ label, value }: { label: string; value: number }) {
  const isDanger = value <= 30
  const barColor = value <= 0 ? "#ff0000" : isDanger ? "#cc2222" : "#d4a017"
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <span
        style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 9,
          color: "#ddd",
          textShadow: "1px 1px 0 #000",
          letterSpacing: 1,
        }}
      >
        {label}
      </span>
      <div
        style={{
          width: 190,
          height: 22,
          background: "#000",
          border: `2px solid ${isDanger ? "#661111" : "#555"}`,
          position: "relative",
          boxShadow: isDanger ? "0 0 8px rgba(200,0,0,0.5)" : "none",
        }}
      >
        <div
          style={{
            width: `${value}%`,
            height: "100%",
            background: `linear-gradient(90deg, ${barColor}88, ${barColor})`,
            transition: "width 0.5s",
          }}
        />
        <span
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 9,
            color: "#fff",
            textShadow: "1px 1px 0 #000",
          }}
        >
          {value} / 100
        </span>
      </div>
      {value <= 0 && (
        <span
          style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 9,
            color: "#ff3333",
            animation: "blink 0.8s infinite",
          }}
        >
          FALHA
        </span>
      )}
    </div>
  )
}

// ── Fire department fleet panel ───────────────────────
function FleetPanel({ fleet }: { fleet: FleetStatus }) {
  return (
    <div
      style={{
        border: "1px solid #405040",
        background: "rgba(0, 8, 0, 0.9)",
        padding: "6px 8px",
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: 10,
        lineHeight: 1.45,
      }}
    >
      <div
        style={{
          color: "#d4a017",
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 7,
          marginBottom: 5,
          letterSpacing: 1,
        }}
      >
        FROTA 193 — CORPO DE BOMBEIROS
      </div>
      {(["ABTR", "SIATE"] as FireUnit[]).map((unit) => {
        const employed = fleet[unit].returnAfter.length
        const available = fleet[unit].total - employed
        return (
          <div
            key={unit}
            style={{
              display: "grid",
              gridTemplateColumns: "42px 1fr 1fr",
              gap: 5,
            }}
          >
            <strong style={{ color: "#fff" }}>{unit}</strong>
            <span style={{ color: "#39ff14" }}>DISPONÍVEIS: {available}</span>
            <span
              style={{
                color:
                  available === 0
                    ? "#ff3333"
                    : employed
                      ? "#d4a017"
                      : "#657565",
              }}
            >
              EMPREGADAS: {employed}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ── Header overlay ────────────────────────────────────
function Header({ morale, conduct }: { morale: number; conduct: number }) {
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: "13%",
        background:
          "linear-gradient(180deg, rgba(10,8,0,0.97) 0%, rgba(10,8,0,0.93) 100%)",
        borderBottom: "3px solid #5a4200",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "6px 20px",
        zIndex: 10,
      }}
    >
      <StatBar label="MORAL DA GUARNIÇÃO" value={morale} />
      <div
        style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 13,
          color: "#d4a017",
          textAlign: "center",
          textShadow: "2px 2px 0 #000",
          lineHeight: 1.7,
        }}
      >
        CÓDIGO 2: <span style={{ color: "#fff" }}>DESPACHO DE EMERGÊNCIA</span>
      </div>
      <StatBar label="CONDUTA MILITAR" value={conduct} />
    </div>
  )
}

// ── Monitor overlay ───────────────────────────────────
function Monitor({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        position: "absolute",
        // matches the AOC monitor position in the reference images
        top: "14%",
        left: "2%",
        width: "40%",
        bottom: "17%",
        background: "rgba(3, 12, 3, 0.93)",
        border: "2px solid #1a3a1a",
        boxShadow:
          "inset 0 0 30px rgba(0,40,0,0.7), 0 0 12px rgba(57,255,20,0.08)",
        padding: "10px 12px",
        zIndex: 10,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      {/* scanlines */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.18) 2px, rgba(0,0,0,0.18) 4px)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />
      <div
        style={{
          position: "relative",
          zIndex: 2,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {children}
      </div>
    </div>
  )
}

// ── Action bar ────────────────────────────────────────
function ActionBar({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        width: "100%",
        minHeight: "14%",
        background: "rgba(0,0,0,0.88)",
        borderTop: "2px solid #2a2a2a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexWrap: "wrap",
        padding: "8px 12px",
        gap: 7,
        zIndex: 10,
      }}
    >
      {children}
    </div>
  )
}

// ── Timer bar ─────────────────────────────────────────
function TimerBar({ value, max }: { value: number; max: number }) {
  const pct = (value / max) * 100
  const color = pct > 60 ? "#39ff14" : pct > 30 ? "#d4a017" : "#ff3333"
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span
        style={{
          color,
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: 12,
          minWidth: 65,
          textShadow: `0 0 6px ${color}`,
        }}
      >
        {value}s
      </span>
      <div
        style={{
          flex: 1,
          height: 6,
          background: "#071007",
          border: "1px solid #1a3a1a",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: color,
            boxShadow: `0 0 5px ${color}`,
            transition: "width 1s linear",
          }}
        />
      </div>
    </div>
  )
}

// ── Button ────────────────────────────────────────────
function Btn({
  onClick,
  color = "#39ff14",
  children,
}: {
  onClick: () => void
  color?: string
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "transparent",
        border: `2px solid ${color}`,
        color,
        fontFamily: "'Press Start 2P', monospace",
        fontSize: 8,
        padding: "7px 14px",
        cursor: "pointer",
        letterSpacing: 1,
        boxShadow: `0 0 8px ${color}22`,
        whiteSpace: "nowrap",
        transition: "background 0.15s",
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLElement).style.background = `${color}22`
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLElement).style.background = "transparent"
      }}
    >
      {children}
    </button>
  )
}

// ── Shared green text style ───────────────────────────
const G = {
  color: "#39ff14",
  fontFamily: "'Share Tech Mono', monospace",
  textShadow: "0 0 6px #39ff14",
  fontSize: 12,
}

const GOLD = {
  color: "#d4a017",
  fontFamily: "'Share Tech Mono', monospace",
  fontSize: 12,
}
const WHITE = {
  color: "#fff",
  fontFamily: "'Share Tech Mono', monospace",
  fontSize: 12,
}

// ── Game Scene wrapper ────────────────────────────────
function Scene({ bg, children }: { bg: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      <img
        src={bg}
        alt=""
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center center",
          userSelect: "none",
        }}
      />
      {children}
    </div>
  )
}

// ─────────────────────────────────────────────────────
export default function App() {
  const { playBGM, playPhoneRing, stopPhoneRing, playDispatchCode2, playError, playGameOver, startLowMoraleAmbience, stopLowMoraleAmbience } = useSoundEffects()
  
  const [gameState, setGameState] = useState<GameState>("MENU")
  const [morale, setMorale] = useState(60)
  const [conduct, setConduct] = useState(80)
  const [scenarioIdx, setScenarioIdx] = useState(0)
  const [selectedCode, setSelectedCode] = useState<1 | 2>(2)
  const [selectedUnits, setSelectedUnits] = useState<Record<FireUnit, boolean>>({
    ABTR: true,
    SIATE: false,
  })
  const [fleet, setFleet] = useState<FleetStatus>(createInitialFleet)
  const [callsCompleted, setCallsCompleted] = useState(0)
  const [dispatchAlert, setDispatchAlert] = useState("")
  const [timer, setTimer] = useState(30)
  const [feedbackText, setFeedbackText] = useState("")
  const [isCorrectDecision, setIsCorrectDecision] = useState(true)
  const [gameOverReason, setGameOverReason] = useState("")
  const [briefCursor, setBriefCursor] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const briefRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const scenario = SCENARIOS[scenarioIdx]
  const decisionTime = getDecisionTime(scenarioIdx)

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const startCountdown = useCallback(
    (seconds: number, onExpire: () => void) => {
      stopTimer()
      setTimer(seconds)
      timerRef.current = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            stopTimer()
            onExpire()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    },
    [stopTimer],
  )

  const checkGameOver = useCallback(
    (m: number, c: number) => {
      if (m <= 0 || c <= 0) {
        setGameOverReason(
          m <= 0
            ? "Moral da guarnição zerada. A equipe recusou-se a sair para qualquer chamada."
            : "Conduta militar severamente comprometida. Transgressão enviada ao Comando.",
        )
        stopTimer()
        setGameState("GAME_OVER")
        playGameOver() 
        return true
      }
      return false
    },
    [stopTimer, playGameOver],
  )

  const processDecision = useCallback(
    (decision: Decision) => {
      const s = SCENARIOS[scenarioIdx]
      const chosenUnits = (["ABTR", "SIATE"] as FireUnit[]).filter(
        (unit) => selectedUnits[unit],
      )

      if (decision === "FIRE" && chosenUnits.length === 0) {
        setDispatchAlert("SELECIONE AO MENOS UMA VIATURA DO 193")
        playError()
        return
      }

      const unavailableUnit = chosenUnits.find(
        (unit) => fleet[unit].total - fleet[unit].returnAfter.length <= 0,
      )
      if (decision === "FIRE" && unavailableUnit) {
        setDispatchAlert(`SEM VIATURA ${unavailableUnit} DISPONÍVEL`)
        playError()
        return
      }

      stopTimer()
      setDispatchAlert("")

      const requiredUnits = s.requiredUnits ?? []
      const hasCorrectUnits =
        chosenUnits.length === requiredUnits.length &&
        requiredUnits.every((unit) => chosenUnits.includes(unit))
      const correct =
        decision === s.correctDecision &&
        (decision !== "FIRE" ||
          (hasCorrectUnits && selectedCode === s.requiredCode))
      setIsCorrectDecision(correct)

      if (!correct) {
        playError()
      } else if (decision === "FIRE" && selectedCode === 2) {
        playDispatchCode2()
      }

      const nextCallsCompleted = callsCompleted + 1
      setCallsCompleted(nextCallsCompleted)
      setFleet((currentFleet) => {
        const nextFleet = createInitialFleet()
        ;(["ABTR", "SIATE"] as FireUnit[]).forEach((unit) => {
          const newlyEmployed =
            decision === "FIRE" && chosenUnits.includes(unit)
              ? [callsCompleted + 2]
              : []
          nextFleet[unit].returnAfter = [
            ...currentFleet[unit].returnAfter,
            ...newlyEmployed,
          ].filter((returnAfter) => returnAfter > nextCallsCompleted)
        })
        return nextFleet
      })

      const newMorale = Math.min(
        100,
        Math.max(
          0,
          morale + (correct ? s.moraleEffect.correct : s.moraleEffect.wrong),
        ),
      )
      const newConduct = Math.min(
        100,
        Math.max(
          0,
          conduct + (correct ? s.conductEffect.correct : s.conductEffect.wrong),
        ),
      )
      setFeedbackText(correct ? s.feedback.correct : s.feedback.wrong)
      setMorale(newMorale)
      setConduct(newConduct)
      if (!checkGameOver(newMorale, newConduct)) setGameState("FEEDBACK")
    },
    [
      scenarioIdx,
      selectedUnits,
      fleet,
      selectedCode,
      callsCompleted,
      morale,
      conduct,
      stopTimer,
      checkGameOver,
      playError,
      playDispatchCode2,
    ],
  )

  const goNextScenario = useCallback(() => {
    const next = scenarioIdx + 1
    if (next >= SCENARIOS.length) {
      setGameState("WIN")
      return
    }
    setScenarioIdx(next)
    setSelectedCode(2)
    setSelectedUnits({ ABTR: true, SIATE: false })
    setDispatchAlert("")
    setGameState("INCOMING")
    playPhoneRing()
    startCountdown(25, () => {
      setGameState("ACTIVE")
      startCountdown(getDecisionTime(next), () => processDecision("DENY"))
    })
  }, [scenarioIdx, startCountdown, processDecision, playPhoneRing])

  const answerCall = useCallback(() => {
    stopTimer()
    stopPhoneRing()
    setGameState("ACTIVE")
    startCountdown(decisionTime, () => processDecision("DENY"))
  }, [
    stopTimer,
    startCountdown,
    decisionTime,
    processDecision,
    stopPhoneRing,
  ])

  const startGame = useCallback(() => {
    setMorale(60)
    setConduct(80)
    setScenarioIdx(0)
    setSelectedCode(2)
    setSelectedUnits({ ABTR: true, SIATE: false })
    setFleet(createInitialFleet())
    setCallsCompleted(0)
    setDispatchAlert("")
    setGameState("BRIEFING")
    playBGM()
  }, [playBGM])

  const beginShift = useCallback(() => {
    setGameState("INCOMING")
    playPhoneRing()
    startCountdown(25, () => {
      setGameState("ACTIVE")
      startCountdown(getDecisionTime(0), () => processDecision("DENY"))
    })
  }, [startCountdown, processDecision, playPhoneRing])

  const restartFromGameOver = useCallback(() => {
    stopTimer()
    setMorale(60)
    setConduct(80)
    setScenarioIdx(0)
    setSelectedCode(2)
    setSelectedUnits({ ABTR: true, SIATE: false })
    setFleet(createInitialFleet())
    setCallsCompleted(0)
    setDispatchAlert("")
    setGameState("INCOMING")
    playBGM()
    playPhoneRing()
    startCountdown(25, () => {
      setGameState("ACTIVE")
      startCountdown(getDecisionTime(0), () => processDecision("DENY"))
    })
  }, [stopTimer, startCountdown, processDecision, playBGM, playPhoneRing])

  // Whispers quando moral baixa
  useEffect(() => {
    if (morale < 40 && gameState !== "GAME_OVER" && gameState !== "MENU") {
      startLowMoraleAmbience()
    } else {
      stopLowMoraleAmbience()
    }
  }, [morale, gameState, startLowMoraleAmbience, stopLowMoraleAmbience])

  // Briefing typewriter
  useEffect(() => {
    if (gameState !== "BRIEFING") {
      if (briefRef.current) {
        clearInterval(briefRef.current)
        briefRef.current = null
      }
      return
    }
    setBriefCursor(0)
    const id = setInterval(() => {
      setBriefCursor((p) => {
        if (p >= BRIEFING_TEXT.length) {
          clearInterval(id)
          return p
        }
        return p + 1
      })
    }, 18)
    briefRef.current = id
    return () => clearInterval(id)
  }, [gameState])

  // Global keyboard
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      if (gameState === "BRIEFING") {
        if (k === " " && briefCursor < BRIEFING_TEXT.length) {
          e.preventDefault()
          setBriefCursor(BRIEFING_TEXT.length)
        } else if (
          (k === "enter" || k === " ") &&
          briefCursor >= BRIEFING_TEXT.length
        ) {
          beginShift()
        }
      }
      if (
        gameState === "INSTRUCTIONS" &&
        (k === "escape" || k === "backspace" || k === "enter")
      ) {
        setGameState("MENU")
      }
      if (gameState === "INCOMING" && (k === "z" || k === "enter")) answerCall()
      if (gameState === "ACTIVE") {
        if (k === "1") setSelectedCode(1)
        if (k === "2") setSelectedCode(2)
        if (k === "a")
          setSelectedUnits((current) => ({ ...current, ABTR: !current.ABTR }))
        if (k === "i")
          setSelectedUnits((current) => ({
            ...current,
            SIATE: !current.SIATE,
          }))
        if (k === "z") processDecision("FIRE")
        if (k === "m") processDecision("SAMU")
        if (k === "p") processDecision("PM")
        if (k === "g") processDecision("GM")
        if (k === "x") processDecision("DENY")
      }
      if (gameState === "FEEDBACK" && (k === "enter" || k === " "))
        goNextScenario()
      if (gameState === "GAME_OVER") {
        if (k === "a") restartFromGameOver()
        if (k === "s") {
          stopTimer()
          setMorale(60)
          setConduct(80)
          setGameState("MENU")
        }
      }
      if (gameState === "WIN" && k === "enter") {
        stopTimer()
        setMorale(60)
        setConduct(80)
        setGameState("MENU")
      }
    }
    window.addEventListener("keydown", h)
    return () => window.removeEventListener("keydown", h)
  }, [
    gameState,
    briefCursor,
    answerCall,
    processDecision,
    goNextScenario,
    selectedCode,
    beginShift,
    restartFromGameOver,
    stopTimer,
  ])

  // ── MENU ──────────────────────────────────────────────
  if (gameState === "MENU") {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(ellipse at center, #1a1200 0%, #050500 60%, #000 100%)",
          gap: 28,
          position: "relative",
        }}
      >
        {/* Scanlines */}
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundImage:
              "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.15) 2px,rgba(0,0,0,0.15) 4px)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 10,
            color: "#7a6010",
            letterSpacing: 3,
          }}
        >
          ▸ SIMULAÇÃO DE DESPACHO MILITAR ◂
        </div>
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: 36,
              color: "#d4a017",
              textShadow: "4px 4px 0 #000",
            }}
          >
            CÓDIGO 2
          </div>
          <div
            style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: 14,
              color: "#fff",
              marginTop: 12,
              textShadow: "2px 2px 0 #000",
            }}
          >
            DESPACHO DE EMERGÊNCIA
          </div>
        </div>
        <div
          style={{
            width: 320,
            height: 2,
            background:
              "linear-gradient(90deg,transparent,#d4a017,transparent)",
          }}
        />
        <div
          style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: 13,
            color: "#888",
            textAlign: "center",
            lineHeight: 2.2,
            maxWidth: 440,
          }}
        >
          Você é o operador recém-designado do COBOM.
          <br />A cidade está em crise. As decisões são suas.
          <br />
          <span style={{ color: "#cc4444" }}>Não cometa erros.</span>
        </div>
        <button
          onClick={startGame}
          style={{
            background: "transparent",
            border: "2px solid #d4a017",
            color: "#d4a017",
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 11,
            padding: "13px 36px",
            cursor: "pointer",
            letterSpacing: 2,
            boxShadow: "0 0 20px rgba(212,160,23,0.25)",
          }}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLElement).style.background = "#d4a01722"
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLElement).style.background = "transparent"
          }}
        >
          [ INICIAR TURNO ]
        </button>
        <button
          onClick={() => setGameState("INSTRUCTIONS")}
          style={{
            background: "transparent",
            border: "1px solid #657565",
            color: "#9eae9e",
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 9,
            padding: "11px 28px",
            cursor: "pointer",
            letterSpacing: 1,
            boxShadow: "0 0 12px rgba(57,255,20,0.08)",
          }}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLElement).style.borderColor = "#39ff14"
            ;(e.currentTarget as HTMLElement).style.color = "#39ff14"
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLElement).style.borderColor = "#657565"
            ;(e.currentTarget as HTMLElement).style.color = "#9eae9e"
          }}
        >
          [ INSTRUÇÕES ]
        </button>
        <div
          style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 8,
            color: "#333",
          }}
        >
          Baseado em Papers, Please e 911 Operator
        </div>
      </div>
    )
  }

  // ── INSTRUCTIONS ──────────────────────────────────────
  if (gameState === "INSTRUCTIONS") {
    const instructions = [
      {
        title: "PRIORIDADE",
        lines: [
          "[1] CÓDIGO 1 — deslocamento normal, sem sirene.",
          "[2] CÓDIGO 2 — emergência com risco imediato.",
        ],
      },
      {
        title: "BOMBEIROS 193",
        lines: [
          "[A] ABTR — incêndio, ferragens e resgate pesado.",
          "[I] SIATE — trauma e atendimento pré-hospitalar.",
          "[Z] Despacha as viaturas e o código selecionados.",
        ],
      },
      {
        title: "OUTROS ÓRGÃOS",
        lines: [
          "[M] SAMU 192 — emergência clínica e mal súbito.",
          "[P] PM 190 — crime, agressão ou ameaça.",
          "[G] GM 153 — patrimônio, postura e apoio municipal.",
        ],
      },
      {
        title: "ENCERRAMENTO",
        lines: [
          "[X] TROTE / NEGAR — encerra chamadas falsas.",
          "Uma decisão incorreta reduz Moral e Conduta.",
        ],
      },
      {
        title: "CONTROLE DE FROTA",
        lines: [
          "ABTR e SIATE possuem duas unidades cada.",
          "Uma viatura empregada retorna após duas chamadas.",
          "Confira DISPONÍVEIS antes de confirmar o despacho.",
        ],
      },
      {
        title: "OBJETIVO",
        lines: [
          "Analise relato, localização, natureza e vítimas.",
          "Preserve a frota e mantenha Moral e Conduta acima de zero.",
        ],
      },
    ]

    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          overflow: "hidden",
          background:
            "radial-gradient(ellipse at center, #101b10 0%, #030803 65%, #000 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          padding: 24,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.22) 2px,rgba(0,0,0,0.22) 4px)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            width: "min(920px, 94vw)",
            maxHeight: "94vh",
            background: "rgba(3,12,3,0.96)",
            border: "2px solid #315231",
            boxShadow:
              "inset 0 0 50px rgba(0,60,0,0.45), 0 0 30px rgba(57,255,20,0.08)",
            padding: "24px 28px",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div
            style={{
              fontFamily: "'Press Start 2P', monospace",
              color: "#d4a017",
              fontSize: 17,
              textAlign: "center",
              textShadow: "2px 2px 0 #000",
              marginBottom: 8,
            }}
          >
            MANUAL DO OPERADOR
          </div>
          <div
            style={{
              fontFamily: "'Share Tech Mono', monospace",
              color: "#657565",
              fontSize: 12,
              textAlign: "center",
              marginBottom: 20,
            }}
          >
            COBOM — CENTRAL DE OPERAÇÕES
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 10,
            }}
          >
            {instructions.map((section) => (
              <div
                key={section.title}
                style={{
                  border: "1px solid #1a3a1a",
                  background: "rgba(0,18,0,0.55)",
                  padding: "11px 13px",
                }}
              >
                <div
                  style={{
                    fontFamily: "'Press Start 2P', monospace",
                    color: "#39ff14",
                    fontSize: 8,
                    marginBottom: 8,
                  }}
                >
                  {section.title}
                </div>
                {section.lines.map((line) => (
                  <div
                    key={line}
                    style={{
                      fontFamily: "'Share Tech Mono', monospace",
                      color: "#d4ddd4",
                      fontSize: 12,
                      lineHeight: 1.55,
                    }}
                  >
                    {line}
                  </div>
                ))}
              </div>
            ))}
          </div>
          <button
            onClick={() => setGameState("MENU")}
            style={{
              display: "block",
              margin: "18px auto 0",
              background: "transparent",
              border: "2px solid #d4a017",
              color: "#d4a017",
              fontFamily: "'Press Start 2P', monospace",
              fontSize: 9,
              padding: "10px 22px",
              cursor: "pointer",
            }}
          >
            [ ENTER / ESC — VOLTAR ]
          </button>
        </div>
      </div>
    )
  }

  // ── BRIEFING ─────────────────────────────────────────
  if (gameState === "BRIEFING") {
    const done = briefCursor >= BRIEFING_TEXT.length
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundImage: `linear-gradient(rgba(0,0,0,0.62), rgba(0,0,0,0.7)), url(${bgBriefing})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div
          style={{
            width: 620,
            background: "rgba(3,12,3,0.97)",
            border: "2px solid #1a3a1a",
            boxShadow: "inset 0 0 40px rgba(0,40,0,0.8)",
            padding: "32px 36px",
            position: "relative",
          }}
        >
          {/* scanlines */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.18) 2px,rgba(0,0,0,0.18) 4px)",
              pointerEvents: "none",
            }}
          />
          <pre
            style={{
              ...G,
              fontSize: 13,
              lineHeight: 1.9,
              whiteSpace: "pre-wrap",
              position: "relative",
              zIndex: 1,
            }}
          >
            {BRIEFING_TEXT.slice(0, briefCursor)}
            {!done && (
              <span
                style={{
                  animation: "blink 0.8s infinite",
                  display: "inline-block",
                }}
              >
                █
              </span>
            )}
          </pre>
          {!done && (
            <button
              onClick={() => setBriefCursor(BRIEFING_TEXT.length)}
              style={{
                display: "block",
                marginTop: 18,
                background: "transparent",
                border: "none",
                cursor: "pointer",
                ...GOLD,
                fontFamily: "'Press Start 2P', monospace",
                fontSize: 8,
                position: "relative",
                zIndex: 1,
              }}
            >
              [ SPACE – ACELERAR TEXTO ]
            </button>
          )}
          {done && (
            <button
              onClick={beginShift}
              style={{
                display: "block",
                marginTop: 18,
                background: "transparent",
                border: "none",
                cursor: "pointer",
                ...G,
                fontFamily: "'Press Start 2P', monospace",
                fontSize: 9,
                animation: "blink 1s infinite",
                position: "relative",
                zIndex: 1,
              }}
            >
              [ ENTER – INICIAR TURNO ]
            </button>
          )}
        </div>
      </div>
    )
  }

  // ── INCOMING CALL ─────────────────────────────────────
  if (gameState === "INCOMING") {
    return (
      <Scene bg={bgIncoming}>
        <Header morale={morale} conduct={conduct} />
        <Monitor>
          <FleetPanel fleet={fleet} />
          <TimerBar value={timer} max={25} />
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
            }}
          >
            <div
              style={{ fontSize: 32, animation: "phone-ring 0.4s infinite" }}
            >
              📞
            </div>
            <div
              style={{
                ...G,
                fontFamily: "'Press Start 2P', monospace",
                fontSize: 9,
                textAlign: "center",
                animation: "blink 0.9s infinite",
              }}
            >
              [CHAMADA ENTRANDO]
            </div>
            <div
              style={{
                ...G,
                fontSize: 11,
                textAlign: "center",
                lineHeight: 1.9,
              }}
            >
              [{scenario.callerVoice}]
              <br />
              <span style={{ color: "#fff" }}>{scenario.incomingSnippet}</span>
            </div>
            <div
              style={{
                ...GOLD,
                fontFamily: "'Press Start 2P', monospace",
                fontSize: 9,
                marginTop: 6,
              }}
            >
              Atender (Z) ?
            </div>
          </div>
          <div style={{ ...G, fontSize: 10, textAlign: "center" }}>
            Ocorrência {scenarioIdx + 1} / {SCENARIOS.length}
          </div>
        </Monitor>
        <ActionBar>
          <Btn onClick={answerCall} color="#39ff14">
            [Z] ATENDER CHAMADA
          </Btn>
          <span style={{ ...G, fontSize: 10, marginLeft: "auto" }}>
            Linha 1 — PT-BR
          </span>
        </ActionBar>
      </Scene>
    )
  }

  // ── ACTIVE CALL ───────────────────────────────────────
  if (gameState === "ACTIVE") {
    return (
      <Scene bg={morale < 40 ? bgActiveStressed : bgActive}>
        <Header morale={morale} conduct={conduct} />
        <Monitor>
          <FleetPanel fleet={fleet} />
          <TimerBar value={timer} max={decisionTime} />
          {timer <= 10 && (
            <div
              style={{
                color: "#ff3333",
                fontFamily: "'Press Start 2P', monospace",
                fontSize: 7,
                textAlign: "center",
                animation: "blink 0.45s infinite",
                textShadow: "0 0 8px #ff0000",
              }}
            >
              TEMPO CRÍTICO — DECIDA AGORA
            </div>
          )}
          <div
            style={{
              ...G,
              fontFamily: "'Press Start 2P', monospace",
              fontSize: 8,
              animation: "blink 1s infinite",
            }}
          >
            [CHAMADA ATIVA – Linha 1]
          </div>
          <div
            style={{
              borderTop: "1px solid #1a3a1a",
              paddingTop: 6,
              lineHeight: 1.9,
            }}
          >
            <div style={GOLD}>[SOLICITANTE]:</div>
            <div
              style={{
                ...WHITE,
                fontSize: 10,
                paddingLeft: 6,
                lineHeight: 1.55,
              }}
            >
              "{scenario.transcript}"
            </div>
          </div>
          <div
            style={{
              borderTop: "1px solid #1a3a1a",
              paddingTop: 6,
              fontSize: 10,
              lineHeight: 1.55,
            }}
          >
            <div style={G}>
              Localização: <span style={WHITE}>[{scenario.location}]</span>
            </div>
            <div style={G}>
              Natureza: <span style={WHITE}>[{scenario.nature}]</span>
            </div>
            <div style={G}>
              Vítimas: <span style={WHITE}>[{scenario.victims}]</span>
            </div>
          </div>
          <div
            style={{
              borderTop: "1px solid #1a3a1a",
              paddingTop: 6,
              fontSize: 10,
            }}
          >
            <div style={G}>
              Prioridade:{" "}
              <span
                onClick={() => setSelectedCode(1)}
                style={{
                  cursor: "pointer",
                  color: selectedCode === 1 ? "#39ff14" : "#3a6a3a",
                  textDecoration: selectedCode === 1 ? "underline" : "none",
                }}
              >
                [CÓDIGO 1]
              </span>{" "}
              <span
                onClick={() => setSelectedCode(2)}
                style={{
                  cursor: "pointer",
                  color: selectedCode === 2 ? "#ff9900" : "#6a4a20",
                  textDecoration: selectedCode === 2 ? "underline" : "none",
                }}
              >
                [CÓDIGO 2{selectedCode === 2 ? " ✓" : ""}]
              </span>
            </div>
            <div style={{ ...G, fontSize: 10, marginTop: 5 }}>
              Viaturas 193:{" "}
              <span
                onClick={() =>
                  setSelectedUnits((current) => ({
                    ...current,
                    ABTR: !current.ABTR,
                  }))
                }
                style={{
                  cursor: "pointer",
                  color: selectedUnits.ABTR ? "#39ff14" : "#3a6a3a",
                }}
              >
                [ABTR{selectedUnits.ABTR ? " ✓" : ""}]
              </span>{" "}
              <span
                onClick={() =>
                  setSelectedUnits((current) => ({
                    ...current,
                    SIATE: !current.SIATE,
                  }))
                }
                style={{
                  cursor: "pointer",
                  color: selectedUnits.SIATE ? "#39ff14" : "#3a6a3a",
                }}
              >
                [SIATE{selectedUnits.SIATE ? " ✓" : ""}]
              </span>
            </div>
            {dispatchAlert && (
              <div
                style={{
                  color: "#ff3333",
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: 7,
                  marginTop: 6,
                  animation: "blink 0.8s infinite",
                }}
              >
                {dispatchAlert}
              </div>
            )}
            <div style={{ color: "#5a8a5a", fontSize: 9, marginTop: 4 }}>
              193: A/I + Z &nbsp;|&nbsp; Órgãos: M/P/G &nbsp;|&nbsp; Trote: X
            </div>
          </div>
        </Monitor>
        <ActionBar>
          <Btn onClick={() => setSelectedCode(1)} color="#39ff14">
            [1] CÓDIGO 1
          </Btn>
          <Btn onClick={() => setSelectedCode(2)} color="#ff9900">
            [2] CÓDIGO 2
          </Btn>
          <Btn
            onClick={() =>
              setSelectedUnits((current) => ({
                ...current,
                ABTR: !current.ABTR,
              }))
            }
            color={selectedUnits.ABTR ? "#39ff14" : "#5a8a5a"}
          >
            [A] ABTR
          </Btn>
          <Btn
            onClick={() =>
              setSelectedUnits((current) => ({
                ...current,
                SIATE: !current.SIATE,
              }))
            }
            color={selectedUnits.SIATE ? "#39ff14" : "#5a8a5a"}
          >
            [I] SIATE
          </Btn>
          <Btn onClick={() => processDecision("FIRE")} color="#d4a017">
            [Z] DESPACHAR 193
          </Btn>
          <Btn onClick={() => processDecision("SAMU")} color="#39ff14">
            [M] SAMU 192
          </Btn>
          <Btn onClick={() => processDecision("PM")} color="#4aa3ff">
            [P] PM 190
          </Btn>
          <Btn onClick={() => processDecision("GM")} color="#62c5a8">
            [G] GM 153
          </Btn>
          <Btn onClick={() => processDecision("DENY")} color="#cc2222">
            [X] TROTE / NEGAR
          </Btn>
        </ActionBar>
      </Scene>
    )
  }

  // ── FEEDBACK ──────────────────────────────────────────
  if (gameState === "FEEDBACK") {
    return (
      <Scene
        bg={
          isCorrectDecision
            ? bgFeedbackSuccess
            : morale < 40
              ? bgActiveStressed
              : bgActive
        }
      >
        <Header morale={morale} conduct={conduct} />
        <Monitor>
          <FleetPanel fleet={fleet} />
          <div
            style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: 9,
              color: isCorrectDecision ? "#39ff14" : "#ff3333",
              textAlign: "center",
              textShadow: `0 0 8px ${
                isCorrectDecision ? "#39ff14" : "#ff3333"
              }`,
              padding: "4px 0",
            }}
          >
            {isCorrectDecision
              ? "▸ DESPACHO CORRETO ◂"
              : "▸ ERRO DE PROTOCOLO ◂"}
          </div>
          <div style={{ borderTop: "1px solid #1a3a1a", paddingTop: 8 }}>
            <div style={GOLD}>[RELATÓRIO DE RÁDIO]</div>
            <div
              style={{ ...WHITE, fontSize: 12, lineHeight: 2, marginTop: 6 }}
            >
              {feedbackText}
            </div>
          </div>
          <div
            style={{
              borderTop: "1px solid #1a3a1a",
              paddingTop: 8,
              marginTop: "auto",
            }}
          >
            <div style={{ ...G, fontSize: 11 }}>
              Moral: {morale}/100 &nbsp;|&nbsp; Conduta: {conduct}/100
            </div>
          </div>
        </Monitor>
        <ActionBar>
          <span
            style={{
              color: "#666",
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: 12,
            }}
          >
            Chamada {scenarioIdx + 1} de {SCENARIOS.length} concluída
          </span>
          <Btn onClick={goNextScenario} color="#d4a017">
            [ENTER] PRÓXIMA CHAMADA
          </Btn>
        </ActionBar>
      </Scene>
    )
  }

  // ── GAME OVER ─────────────────────────────────────────
  if (gameState === "GAME_OVER") {
    return (
      <Scene bg={bgGameOver}>
        <Header morale={morale} conduct={conduct} />
        {/* Red failure overlay across the entire scene */}
        <div
          style={{
            position: "absolute",
            top: "13%",
            left: 0,
            width: "100%",
            bottom: 0,
            background: "rgba(80,0,0,0.55)",
            zIndex: 5,
          }}
        />
        {/* Consequence text box */}
        <div
          style={{
            position: "absolute",
            bottom: "12%",
            left: "5%",
            width: "68%",
            background: "rgba(0,0,0,0.88)",
            border: "2px solid #555",
            padding: "14px 18px",
            zIndex: 20,
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: 14,
            color: "#ddd",
            lineHeight: 1.8,
            textAlign: "center",
          }}
        >
          {gameOverReason}
        </div>
        {/* Action buttons at bottom */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: "100%",
            height: "10%",
            background: "rgba(0,0,0,0.92)",
            borderTop: "2px solid #2a2a2a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 28,
            zIndex: 20,
          }}
        >
          <Btn onClick={restartFromGameOver} color="#d4a017">
            [A] TENTAR NOVAMENTE
          </Btn>
          <Btn
            onClick={() => {
              stopTimer()
              setMorale(60)
              setConduct(80)
              setGameState("MENU")
            }}
            color="#555"
          >
            [S] MENU PRINCIPAL
          </Btn>
        </div>
      </Scene>
    )
  }

  // ── WIN ───────────────────────────────────────────────
  if (gameState === "WIN") {
    return (
      <Scene bg={bgFeedbackSuccess}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,20,0,0.7)",
            zIndex: 5,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 24,
          }}
        >
          <div
            style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: 28,
              color: "#39ff14",
              textShadow: "3px 3px 0 #006600, 0 0 30px #39ff14",
            }}
          >
            TURNO CONCLUÍDO
          </div>
          <div
            style={{
              background: "rgba(3,12,3,0.97)",
              border: "2px solid #1a3a1a",
              boxShadow: "inset 0 0 40px rgba(0,40,0,0.8)",
              padding: "28px 40px",
              textAlign: "center",
            }}
          >
            <div style={{ ...G, fontSize: 13, lineHeight: 2.2 }}>
              RELATÓRIO FINAL DO TURNO
              <br />
              ─────────────────────────
              <br />
              Moral da Guarnição: {morale}/100
              <br />
              Conduta Militar: {conduct}/100
              <br />
              Chamadas atendidas: {SCENARIOS.length}/{SCENARIOS.length}
              <br />
              ─────────────────────────
              <br />
              <span style={{ color: "#fff" }}>STATUS: APROVADO</span>
            </div>
          </div>
          <div
            style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: 14,
              color: "#888",
              textAlign: "center",
              lineHeight: 2,
            }}
          >
            Você sobreviveu ao turno, Operador.
            <br />A cidade permanece de pé.
          </div>
          <Btn
            onClick={() => {
              setMorale(60)
              setConduct(80)
              setScenarioIdx(0)
              setGameState("MENU")
            }}
            color="#39ff14"
          >
            [ MENU PRINCIPAL ]
          </Btn>
        </div>
      </Scene>
    )
  }

  return null
}
