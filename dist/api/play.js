const sources = require('./sources.json');
module.exports = (req, res) => {
 res.setHeader('Cache-Control','private, no-store');
 const source = sources[String(req.query.id)];
 if (!Array.isArray(source)) return res.status(404).end();
 const base = process.env[source[0]==='series'?'SERIES_BASE_URL':'MOVIE_BASE_URL'];
 let override; try { override = JSON.parse(process.env.PLAYBACK_OVERRIDES || '{}')[String(req.query.id)]; } catch { return res.status(503).end(); }
 if ((!base && !override) || !process.env.FAMILY_PIN) return res.status(503).end();
 if(req.headers['x-family-pin']!==process.env.FAMILY_PIN) return res.status(401).end();
 const url=override ? new URL(override) : new URL(source[1],base.replace(/\/?$/,'/'));
 if(url.protocol!=='https:') return res.status(422).end();
 return res.json({url:url.href});
};

