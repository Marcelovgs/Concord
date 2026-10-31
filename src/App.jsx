import { useEffect, useState, useRef } from 'react'
import Sidebar from './components/Sidebar.jsx'
import ChatPanel from './components/ChatPanel.jsx'
import VideoArea from './components/VideoArea.jsx'
import Configuracoes from './components/Configuracoes.jsx'

function App() {
  const [telaLogin, setTelaLogin] = useState(true)
  const [meuNomeInput, setMeuNomeInput] = useState('')
  const [meuNome, setMeuNome] = useState('')
  const [meuId] = useState(() => Math.random().toString(36).substring(2, 9))

  const [status, setStatus] = useState('A ligar...')
  const [usuariosNaSala, setUsuariosNaSala] = useState([])
  const [nomesUsuarios, setNomesUsuarios] = useState({})
  const [usuariosFalando, setUsuariosFalando] = useState({})

  const [streamsRemotos, setStreamsRemotos] = useState({})
  const [janelas, setJanelas] = useState([])
  const [mostrarModal, setMostrarModal] = useState(false)

  const [micMutado, setMicMutado] = useState(false)
  const [foneMutado, setFoneMutado] = useState(false)
  const [menuContexto, setMenuContexto] = useState(null)
  const [volumesUsuarios, setVolumesUsuarios] = useState({})
  const [mensagens, setMensagens] = useState([])
  const [novaMensagem, setNovaMensagem] = useState('')
  const [transmitindo, setTransmitindo] = useState(false)

  // ESTADOS DE SENSIBILIDADE E MENU
  const [mostrarConfiguracoes, setMostrarConfiguracoes] = useState(false)
  const [sensibilidade, setSensibilidade] = useState(10) // Valor padrão (0 a 50)

  const sensibilidadeRef = useRef(10)
  const micMutadoRef = useRef(false)
  const gainNodeGlobal = useRef(null) // Age como o Portão de Ruído

  useEffect(() => { sensibilidadeRef.current = sensibilidade }, [sensibilidade])

  const videoLocal = useRef(null)
  const ws = useRef(null)
  const peers = useRef({})
  const canaisDeDados = useRef({})
  const streamLocal = useRef(null)
  const micStreamGlobal = useRef(null)
  const chatFimRef = useRef(null)
  const analisadoresCriados = useRef({})

  useEffect(() => { chatFimRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [mensagens])

  // ANALISADOR INTELIGENTE COM SENSIBILIDADE
  const monitorarAudio = (id, stream) => {
    if (!stream || stream.getAudioTracks().length === 0 || analisadoresCriados.current[id]) return
    analisadoresCriados.current[id] = true

    const audioCtx = new AudioContext()
    const analyser = audioCtx.createAnalyser()
    analyser.fftSize = 256
    const source = audioCtx.createMediaStreamSource(stream)
    source.connect(analyser)
    const dataArray = new Uint8Array(analyser.frequencyBinCount)

    const verificar = () => {
      analyser.getByteFrequencyData(dataArray)
      let soma = 0
      for (let i = 0; i < dataArray.length; i++) soma += dataArray[i]
      const media = soma / dataArray.length

      // Atingiu o limite de Sensibilidade que definiu nas configurações?
      const estaFalando = media > sensibilidadeRef.current
      setUsuariosFalando(prev => prev[id] === estaFalando ? prev : { ...prev, [id]: estaFalando })

      // SE FOR O SEU MIC: Corta o envio de som para a rede se não falar alto o suficiente!
      if (id === meuId && gainNodeGlobal.current) {
        const deveTransmitir = !micMutadoRef.current && estaFalando
        gainNodeGlobal.current.gain.value = deveTransmitir ? 1 : 0
      }

      requestAnimationFrame(verificar)
    }
    verificar()
  }

  const adicionarMensagem = (remetente, texto) => setMensagens(prev => [...prev, { id: Math.random(), remetente, texto, hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }])

  const enviarMensagemDeTexto = (e) => {
    if (e.key === 'Enter' && novaMensagem.trim() !== '') {
      adicionarMensagem(meuId, novaMensagem)
      Object.values(canaisDeDados.current).forEach(dc => {
        if (dc.readyState === 'open') dc.send(JSON.stringify({ remetente: meuId, texto: novaMensagem }))
      })
      setNovaMensagem('')
    }
  }

  const adicionarUsuario = (id, nomeFornecido) => {
    setUsuariosNaSala(prev => prev.includes(id) ? prev : [...prev, id])
    setVolumesUsuarios(prev => ({ ...prev, [id]: prev[id] ?? 1 }))
    if (nomeFornecido) setNomesUsuarios(prev => ({ ...prev, [id]: nomeFornecido }))
  }

  const iniciarVozBase = async () => {
    try {
      const micRaw = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } })

      // Criamos um filtro no meio: Som Bruto -> Portão de Sensibilidade -> Som para Rede
      const ctxAudio = new AudioContext()
      await ctxAudio.resume()
      const fonteMic = ctxAudio.createMediaStreamSource(micRaw)

      const gainNode = ctxAudio.createGain()
      gainNode.gain.value = 1
      gainNodeGlobal.current = gainNode

      const destinoGanho = ctxAudio.createMediaStreamDestination()
      fonteMic.connect(gainNode)
      gainNode.connect(destinoGanho)

      const micProcessado = destinoGanho.stream
      micStreamGlobal.current = micProcessado

      // Analisamos o som BRUTO para saber se está a falar, mesmo que o portão esteja fechado
      monitorarAudio(meuId, micRaw)

      streamLocal.current = new MediaStream(micProcessado.getTracks())

      Object.keys(peers.current).forEach(async (idAmigo) => {
        const pc = peers.current[idAmigo]
        pc.getSenders().forEach(sender => pc.removeTrack(sender))
        streamLocal.current.getTracks().forEach(track => pc.addTrack(track, streamLocal.current))
        const oferta = await pc.createOffer()
        await pc.setLocalDescription(oferta)
        ws.current.send(JSON.stringify({ tipo: 'oferta', de: meuId, para: idAmigo, sdp: oferta }))
      })
    } catch (e) { console.warn("Microfone negado.") }
  }

  const criarConexao = (idAmigo) => {
    if (peers.current[idAmigo]) return peers.current[idAmigo]
    const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] })
    pc.onicecandidate = (e) => { if (e.candidate) ws.current.send(JSON.stringify({ tipo: 'ice', de: meuId, para: idAmigo, candidato: e.candidate })) }
    pc.ontrack = (e) => {
      setStreamsRemotos(prev => ({ ...prev, [idAmigo]: e.streams[0] }))
      monitorarAudio(idAmigo, e.streams[0])
    }
    pc.ondatachannel = (e) => {
      e.channel.onmessage = (event) => {
        const dados = JSON.parse(event.data)
        adicionarMensagem(dados.remetente, dados.texto)
      }
      canaisDeDados.current[idAmigo] = e.channel
    }

    if (streamLocal.current) streamLocal.current.getTracks().forEach(track => pc.addTrack(track, streamLocal.current))
    peers.current[idAmigo] = pc
    return pc
  }

  useEffect(() => {
    if (telaLogin) return
    ws.current = new WebSocket('ws://localhost:9000')
    ws.current.onopen = () => {
      setStatus('Voz conectada')
      adicionarUsuario(meuId, meuNome)
      ws.current.send(JSON.stringify({ tipo: 'entrou', de: meuId, nome: meuNome, para: 'todos' }))
      iniciarVozBase()
    }
    ws.current.onmessage = async (event) => {
      const msg = JSON.parse(event.data)
      if (msg.de === meuId || (msg.para !== 'todos' && msg.para !== meuId)) return
      const idAmigo = msg.de
      if (msg.nome) adicionarUsuario(idAmigo, msg.nome)

      if (msg.tipo === 'entrou') {
        const pc = criarConexao(idAmigo)
        const dc = pc.createDataChannel('chat')
        dc.onmessage = (ev) => {
          const dados = JSON.parse(ev.data)
          adicionarMensagem(dados.remetente, dados.texto)
        }
        canaisDeDados.current[idAmigo] = dc
        ws.current.send(JSON.stringify({ tipo: 'estou-aqui', de: meuId, nome: meuNome, para: idAmigo }))
        if (streamLocal.current) {
          const oferta = await pc.createOffer()
          await pc.setLocalDescription(oferta)
          ws.current.send(JSON.stringify({ tipo: 'oferta', de: meuId, para: idAmigo, sdp: oferta }))
        }
      } else if (msg.tipo === 'estou-aqui') criarConexao(idAmigo)
      else if (msg.tipo === 'oferta') {
        const pc = criarConexao(idAmigo)
        await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp))
        const resposta = await pc.createAnswer()
        await pc.setLocalDescription(resposta)
        ws.current.send(JSON.stringify({ tipo: 'resposta', de: meuId, para: idAmigo, sdp: resposta }))
      } else if (msg.tipo === 'resposta') {
        const pc = peers.current[idAmigo]
        if (pc) await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp))
      } else if (msg.tipo === 'ice') {
        const pc = peers.current[idAmigo]
        if (pc && pc.remoteDescription) await pc.addIceCandidate(new RTCIceCandidate(msg.candidato)).catch(() => { })
      }
    }
    return () => ws.current?.close()
  }, [telaLogin, meuId, meuNome])

  const abrirMenuDeJanelas = async () => {
    try {
      const { ipcRenderer } = window.require('electron')
      const sources = await ipcRenderer.invoke('obter-janelas')
      setJanelas(sources)
      setMostrarModal(true)
    } catch (e) { alert('Exclusivo do aplicativo Desktop.') }
  }

  const selecionarJanela = async (sourceId) => {
    setMostrarModal(false)
    try {
      const micStreamProcessado = micStreamGlobal.current
      const isScreen = sourceId.startsWith('screen')
      const desktopStream = await navigator.mediaDevices.getUserMedia({
        audio: isScreen ? { mandatory: { chromeMediaSource: 'desktop', chromeMediaSourceId: sourceId } } : false,
        video: { mandatory: { chromeMediaSource: 'desktop', chromeMediaSourceId: sourceId } }
      })
      const ctxAudio = new AudioContext()
      await ctxAudio.resume()
      const destino = ctxAudio.createMediaStreamDestination()
      let audioAdicionado = false

      if (desktopStream.getAudioTracks().length > 0) { ctxAudio.createMediaStreamSource(desktopStream).connect(destino); audioAdicionado = true }
      // Injeta o mic com a sensibilidade aplicada na Live
      if (micStreamProcessado && micStreamProcessado.getAudioTracks().length > 0) { ctxAudio.createMediaStreamSource(micStreamProcessado).connect(destino); audioAdicionado = true }

      const faixas = [...desktopStream.getVideoTracks()]
      if (audioAdicionado) faixas.push(...destino.stream.getAudioTracks())
      const streamFinal = new MediaStream(faixas)

      streamLocal.current = streamFinal
      setTransmitindo(true)
      setTimeout(() => { if (videoLocal.current) videoLocal.current.srcObject = streamFinal }, 100)

      Object.keys(peers.current).forEach(async (idAmigo) => {
        const pc = peers.current[idAmigo]
        pc.getSenders().forEach(sender => pc.removeTrack(sender))
        streamFinal.getTracks().forEach(track => pc.addTrack(track, streamFinal))
        const oferta = await pc.createOffer()
        await pc.setLocalDescription(oferta)
        ws.current.send(JSON.stringify({ tipo: 'oferta', de: meuId, para: idAmigo, sdp: oferta }))
      })
    } catch (erro) { console.error(erro) }
  }

  const pararTransmissao = () => {
    if (streamLocal.current) streamLocal.current.getTracks().forEach(track => track.stop())
    if (videoLocal.current) videoLocal.current.srcObject = null
    setTransmitindo(false)

    if (micStreamGlobal.current) {
      streamLocal.current = new MediaStream(micStreamGlobal.current.getTracks())
    } else {
      streamLocal.current = null
    }

    Object.keys(peers.current).forEach(async (idAmigo) => {
      const pc = peers.current[idAmigo]
      pc.getSenders().forEach(sender => pc.removeTrack(sender))
      if (streamLocal.current) streamLocal.current.getTracks().forEach(track => pc.addTrack(track, streamLocal.current))
      const oferta = await pc.createOffer()
      await pc.setLocalDescription(oferta)
      ws.current.send(JSON.stringify({ tipo: 'oferta', de: meuId, para: idAmigo, sdp: oferta }))
    })
  }

  const alternarMic = () => {
    const novoEstado = !micMutado
    setMicMutado(novoEstado)
    micMutadoRef.current = novoEstado
    // O monitorador no requestAnimationFrame deteta a ref e corta o som automaticamente!
  }

  const conectarUsuario = () => {
    if (meuNomeInput.trim() !== '') {
      setMeuNome(meuNomeInput)
      setTelaLogin(false)
    }
  }

  if (telaLogin) {
    return (
      <div style={{ display: 'flex', width: '100vw', height: '100vh', backgroundColor: '#313338', color: '#dbdee1', justifyContent: 'center', alignItems: 'center', fontFamily: '"gg sans", "Noto Sans", Helvetica, Arial, sans-serif' }}>
        <div style={{ backgroundColor: '#2b2d31', padding: '32px', borderRadius: '8px', width: '300px', boxShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#f2f3f5' }}>Lair Of Gods</h2>
          <div style={{ marginBottom: '8px', fontSize: '12px', fontWeight: 'bold', color: '#b5bac1', textTransform: 'uppercase' }}>Como quer ser chamado?</div>
          <input
            type="text"
            value={meuNomeInput}
            onChange={(e) => setMeuNomeInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && conectarUsuario()}
            style={{ width: '100%', padding: '10px', backgroundColor: '#1e1f22', border: 'none', borderRadius: '4px', color: '#dbdee1', outline: 'none', marginBottom: '20px' }}
            placeholder="O seu nome"
            autoFocus
          />
          <button
            onClick={conectarUsuario}
            style={{ width: '100%', padding: '10px', backgroundColor: '#5865F2', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            Entrar na Sala
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', color: '#dbdee1' }}>

      <Sidebar
        meuId={meuId}
        meuNome={meuNome}
        status={status}
        usuariosNaSala={usuariosNaSala}
        nomesUsuarios={nomesUsuarios}
        usuariosFalando={usuariosFalando}
        handleContextMenu={(e, id) => setMenuContexto({ x: e.pageX, y: e.pageY, id })}
        abrirMenuDeJanelas={abrirMenuDeJanelas}
        micMutado={micMutado}
        alternarMic={alternarMic}
        foneMutado={foneMutado}
        alternarFone={() => setFoneMutado(!foneMutado)}
        transmitindo={transmitindo}
        pararTransmissao={pararTransmissao}
        abrirConfiguracoes={() => setMostrarConfiguracoes(true)} // Ícone agora funciona
      />

      <VideoArea
        streamLocal={streamLocal}
        videoLocal={videoLocal}
        streamsRemotos={streamsRemotos}
        volumesUsuarios={volumesUsuarios}
        foneMutado={foneMutado}
      />

      <ChatPanel
        meuId={meuId}
        meuNome={meuNome}
        nomesUsuarios={nomesUsuarios}
        mensagens={mensagens}
        novaMensagem={novaMensagem}
        setNovaMensagem={setNovaMensagem}
        enviarMensagemDeTexto={enviarMensagemDeTexto}
        chatFimRef={chatFimRef}
      />

      {/* Menu Modal de Definições de Voz */}
      {mostrarConfiguracoes && (
        <Configuracoes
          fechar={() => setMostrarConfiguracoes(false)}
          sensibilidade={sensibilidade}
          setSensibilidade={setSensibilidade}
        />
      )}

      {mostrarModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#313338', padding: '20px', borderRadius: '8px', maxWidth: '80%', maxHeight: '80%', overflowY: 'auto' }}>
            <h3 style={{ marginTop: 0 }}>Escolha o que partilhar:</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', justifyContent: 'center' }}>
              {janelas.map(janela => (
                <div key={janela.id} onClick={() => selecionarJanela(janela.id)} style={{ cursor: 'pointer', background: '#2b2d31', padding: '10px', borderRadius: '8px', width: '160px' }}>
                  <img src={janela.miniatura} alt={janela.nome} style={{ width: '100%', borderRadius: '4px' }} />
                  <p style={{ margin: '10px 0 0', fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{janela.nome}</p>
                </div>
              ))}
            </div>
            <button onClick={() => setMostrarModal(false)} style={{ marginTop: '20px', padding: '8px 16px', cursor: 'pointer', backgroundColor: '#ed4245', color: 'white', border: 'none', borderRadius: '4px' }}>Cancelar</button>
          </div>
        </div>
      )}

      {menuContexto && (
        <>
          <div onClick={() => setMenuContexto(null)} style={{ position: 'fixed', inset: 0, zIndex: 999 }} />
          <div style={{ position: 'fixed', top: menuContexto.y, left: menuContexto.x, backgroundColor: '#111214', padding: '12px', borderRadius: '6px', zIndex: 1000, boxShadow: '0 8px 16px rgba(0,0,0,0.5)', width: '220px' }}>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#b5bac1', marginBottom: '8px' }}>Volume de {nomesUsuarios[menuContexto.id] || menuContexto.id}</div>
            <input type="range" min="0" max="1" step="0.01" value={volumesUsuarios[menuContexto.id]} onChange={(e) => setVolumesUsuarios(prev => ({ ...prev, [menuContexto.id]: parseFloat(e.target.value) }))} style={{ width: '100%', accentColor: '#5865F2' }} />
          </div>
        </>
      )}
    </div>
  )
}

export default App