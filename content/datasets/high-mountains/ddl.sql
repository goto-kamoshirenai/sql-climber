CREATE TABLE mountains (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  altitude INTEGER NOT NULL,
  range_name TEXT NOT NULL,
  prefecture TEXT NOT NULL
);

CREATE TABLE routes (
  id INTEGER PRIMARY KEY,
  mountain_id INTEGER NOT NULL REFERENCES mountains(id),
  name TEXT NOT NULL,
  distance_km REAL NOT NULL,
  ascent_m INTEGER NOT NULL,
  level TEXT NOT NULL
);

CREATE TABLE huts (
  id INTEGER PRIMARY KEY,
  mountain_id INTEGER NOT NULL REFERENCES mountains(id),
  name TEXT NOT NULL,
  altitude INTEGER NOT NULL,
  capacity INTEGER NOT NULL,
  price INTEGER NOT NULL
);

CREATE TABLE climbers (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  birth_year INTEGER NOT NULL,
  club TEXT,
  mentor_id INTEGER REFERENCES climbers(id)
);

CREATE TABLE reservations (
  id INTEGER PRIMARY KEY,
  climber_id INTEGER NOT NULL REFERENCES climbers(id),
  hut_id INTEGER NOT NULL REFERENCES huts(id),
  stay_on TEXT NOT NULL,
  nights INTEGER NOT NULL,
  status TEXT NOT NULL
);

CREATE TABLE climb_records (
  id INTEGER PRIMARY KEY,
  climber_id INTEGER NOT NULL REFERENCES climbers(id),
  route_id INTEGER NOT NULL REFERENCES routes(id),
  climbed_on TEXT NOT NULL,
  duration_min INTEGER NOT NULL,
  reached_summit INTEGER NOT NULL
);
