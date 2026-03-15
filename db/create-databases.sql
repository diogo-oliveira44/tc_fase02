CREATE DATABASE tc_db_test;
CREATE DATABASE tc_db_dev;
CREATE DATABASE tc_db_prod;

\c tc_db_test;
CREATE TABLE IF NOT EXISTS posts (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  author VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO posts (title, content, author) VALUES
('First Post', 'This is the content of the first post.', 'Alice'),
('Second Post', 'This is the content of the second post.', 'Bob'),
('Third Post', 'This is the content of the third post.', 'Charlie'),
('Fourth Post', 'This is the content of the fourth post.', 'Dave'),
('Fifth Post', 'This is the content of the fifth post.', 'Eve'),
('Sixth Post', 'This is the content of the sixth post.', 'Frank'),
('Seventh Post', 'This is the content of the seventh post.', 'Grace'),
('Eighth Post', 'This is the content of the eighth post.', 'Heidi'),
('Ninth Post', 'This is the content of the ninth post.', 'Ivan'),
('Tenth Post', 'This is the content of the tenth post.', 'Judy');

\c tc_db_dev;

CREATE TABLE IF NOT EXISTS posts (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  author VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO posts (title, content, author) VALUES
('First Post', 'This is the content of the first post.', 'Alice'),
('Second Post', 'This is the content of the second post.', 'Bob'),
('Third Post', 'This is the content of the third post.', 'Charlie'),
('Fourth Post', 'This is the content of the fourth post.', 'Dave'),
('Fifth Post', 'This is the content of the fifth post.', 'Eve'),
('Sixth Post', 'This is the content of the sixth post.', 'Frank'),
('Seventh Post', 'This is the content of the seventh post.', 'Grace'),
('Eighth Post', 'This is the content of the eighth post.', 'Heidi'),
('Ninth Post', 'This is the content of the ninth post.', 'Ivan'),
('Tenth Post', 'This is the content of the tenth post.', 'Judy');


\c tc_db_prod;

CREATE TABLE IF NOT EXISTS posts (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  author VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO posts (title, content, author) VALUES
('First Post', 'This is the content of the first post.', 'Alice'),
('Second Post', 'This is the content of the second post.', 'Bob'),
('Third Post', 'This is the content of the third post.', 'Charlie'),
('Fourth Post', 'This is the content of the fourth post.', 'Dave'),
('Fifth Post', 'This is the content of the fifth post.', 'Eve'),
('Sixth Post', 'This is the content of the sixth post.', 'Frank'),
('Seventh Post', 'This is the content of the seventh post.', 'Grace'),
('Eighth Post', 'This is the content of the eighth post.', 'Heidi'),
('Ninth Post', 'This is the content of the ninth post.', 'Ivan'),
('Tenth Post', 'This is the content of the tenth post.', 'Judy');

