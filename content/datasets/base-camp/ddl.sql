CREATE TABLE mountains (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  altitude INTEGER NOT NULL,
  prefecture TEXT NOT NULL,
  area TEXT NOT NULL,
  has_ropeway INTEGER NOT NULL
);

CREATE TABLE climbers (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  prefecture TEXT NOT NULL,
  club TEXT,
  joined_on TEXT NOT NULL
);

CREATE TABLE climb_records (
  id INTEGER PRIMARY KEY,
  climber_id INTEGER NOT NULL REFERENCES climbers(id),
  mountain_id INTEGER NOT NULL REFERENCES mountains(id),
  climbed_on TEXT NOT NULL,
  duration_min INTEGER NOT NULL,
  weather TEXT NOT NULL,
  reached_summit INTEGER NOT NULL
);
