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

  // --- CREDENCIALES FIJAS DE TU CLIENTE PARA LA APP ---
  const USUARIO_VALIDO = "leonardo";
  const PASSWORD_VALIDO = "leonardo";
  
  // --- DATOS DE TU PROVEEDOR FIVETV (YA CONFIGURADOS) ---
  const PROVEEDOR_BASE = "http://fivetv.org:25461"; 
  const PROVEEDOR_USER = "karina20";               
  const PROVEEDOR_PASS = "ruiz2200";               

  // Validar credenciales del cliente en la App
  if (username !== USUARIO_VALIDO || password !== PASSWORD_VALIDO) {
    return res.status(200).json({ user_info: { auth: 0, status: "Credenciales Incorrectas" } });
  }

  try {
    // CASO A: Reproducción de canales o películas
    if (stream_id) {
      let tipoStream = "live";
      if (req.url.includes("movie") || req.url.includes("vod")) tipoStream = "movie";
      if (req.url.includes("series")) tipoStream = "series";
      return res.redirect(302, `${PROVEEDOR_BASE}/${tipoStream}/${PROVEEDOR_USER}/${PROVEEDOR_PASS}/${stream_id}.ts`);
    }

    // CASO B: Descarga de listas o categorías
    if (action) {
      return res.redirect(302, `${PROVEEDOR_BASE}/player_api.php?username=${PROVEEDOR_USER}&password=${PROVEEDOR_PASS}&action=${action}`);
    }

    // CASO C: Login inicial exitoso simulando Xtream Codes
    return res.status(200).json({
      user_info: {
        auth: 1,
        status: "Active",
        exp_date: "1875139200", // Año 2029
        max_connections: "2"
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
