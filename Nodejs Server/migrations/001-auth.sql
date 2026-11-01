CREATE TABLE IF NOT EXISTS users (
  UserId BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(32) NOT NULL,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(254) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS email_challenges (
  challenge_id CHAR(64) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  email VARCHAR(254) NOT NULL,
  otp_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  expires_at BIGINT NOT NULL,
  sent_at BIGINT NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  proof_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NULL,
  proof_expires_at BIGINT NULL,
  UNIQUE KEY email_challenge_email (email),
  UNIQUE KEY email_challenge_proof (proof_hash),
  KEY email_challenge_expiry (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS auth_sessions (
  token_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  expires_at BIGINT NOT NULL,
  KEY auth_session_expiry (expires_at),
  KEY auth_session_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
