export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const urlParams = req.query || {};
  const username = urlParams.username || urlParams.user;
  const password = urlParams.password || urlParams.pass;
  const action = urlParams.action;
  const stream_id = urlParams.stream_id || urlParams.series_id || urlParams.vod_id;

  if (!username || !password) {
    return res.status(200).json({ user_info: { auth: 0, status: "Faltan Credenciales" } });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;

  try {
    const urlConsulta = `${SUPABASE_URL}/rest/v1/usuarios_iptv?username=eq.${username}&password=eq.${password}&select=cliente,fecha_vencimiento,estado,conexiones_maximas,url_proveedor_m3u`;
    
    const respuestaSupabase = await fetch(urlConsulta, {
      method: "GET",
      headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` }
    });

    const usuarios = await respuestaSupabase.json();

    if (!usuarios || usuarios.length === 0) {
      return res.status(200).json({ user_info: { auth: 0, status: "Credenciales Incorrectas" } });
    }

    const usuario = usuarios[0];
    const fechaActual = new Date();
    const fechaVencimiento = new Date(usuario.fecha_vencimiento);

    if (usuario.estado !== "activo" || fechaActual > fechaVencimiento) {
      return res.status(200).json({ user_info: { auth: 0, status: "Suscripcion Expirada" } });
    }

    const urlCompletaProv = usuario.url_proveedor_m3u;
    const baseMatch = urlCompletaProv.match(/^https?:\/\/[^\/]+/);
    const PROVEEDOR_BASE = baseMatch ? baseMatch[0] : "";
    
    const userMatch = urlCompletaProv.match(/[?&](username|user)=([^&]+)/);
    const passMatch = urlCompletaProv.match(/[?&](password|pass)=([^&]+)/);
    const PROVEEDOR_USER = userMatch ? userMatch[2] : "";
    const PROVEEDOR_PASS = passMatch ? passMatch[2] : "";

    if (stream_id) {
      let tipoStream = "live";
      if (req.url.includes("movie") || req.url.includes("vod")) tipoStream = "movie";
      if (req.url.includes("series")) tipoStream = "series";
      return res.redirect(302, `${PROVEEDOR_BASE}/${tipoStream}/${PROVEEDOR_USER}/${PROVEEDOR_PASS}/${stream_id}.ts`);
    }

    if (action) {
      return res.redirect(302, `${PROVEEDOR_BASE}/player_api.php?username=${PROVEEDOR_USER}&password=${PROVEEDOR_PASS}&action=${action}`);
    }

    return res.status(200).json({
      user_info: {
        auth: 1,
        status: "Active",
        exp_date: Math.floor(fechaVencimiento.getTime() / 1000).toString(),
        max_connections: usuario.conexiones_maximas.toString()
      },
      server_info: {
        server_url: req.headers.host || "localhost",
        port: "80",
        https_port: "443",
        server_protocol: "http",
        rtmp_port: "8000"
      }
    });

  } catch (error) {
    return res.status(200).json({ user_info: { auth: 0, status: "Error de Servidor Proxy" } });
  }
}
