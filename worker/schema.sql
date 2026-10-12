-- Esquema del backend de comentarios y ranking (D1). Idempotente.
-- Una fila por envío: apodo + puntaje + comentario opcional. El ranking es un
-- GROUP BY apodo con MAX(score); los comentarios son las filas con comentario.
CREATE TABLE IF NOT EXISTS partidas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id TEXT NOT NULL,
  apodo TEXT NOT NULL,
  score INTEGER NOT NULL,
  comentario TEXT,
  ip_hash TEXT NOT NULL,
  visible INTEGER NOT NULL DEFAULT 1,
  creado_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_partidas_juego_score ON partidas (game_id, visible, score DESC);
CREATE INDEX IF NOT EXISTS idx_partidas_juego_reciente ON partidas (game_id, visible, creado_at DESC);
CREATE INDEX IF NOT EXISTS idx_partidas_rate ON partidas (ip_hash, game_id, creado_at);
