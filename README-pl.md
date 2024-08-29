# MojaM

![pl](https://img.shields.io/badge/lang-pl-red.svg)

## Back-end

Aplikacja napisana w TypeScript, uruchamiana w środowisku NodeJS  
Korzysta z bazy danych MySQL, przed uruchomieniem proszę przygotować poprawnie skonfigurowaną bazę MySQL  
Połączenie do bazy realizowane jest za pomocą [TypeORM](https://typeorm.io/).  

## Instalacja
1. W konsoli wejdź do folderu ``backend``
2. Będąc w folderze ``backend`` uruchom komendę ``npm run init``.
3. Otwórz plik ``backend\.env.development.local`` i ustaw zmienne środowiskowe (domyślna konfiguracja poniżej).
4. Otwórz plik ``backend\src\dataBase\data-source.ts`` i ustaw parametry połączenia do bazy danych.
5. Utwórz bazę danych i niezbędne tabele, w tym celu będąc w folderze ``backend`` uruchom komendę ``npm run migration:run``. Komenda ta uruchamia migracje SQL.
6. Uruchom aplikację komendą ``npm run dev``

### Domyślne zmienne środowiskowe
```ini
# PORT
PORT = 5100
BASE_PATH = /api

# TOKEN
ACCESS_TOKEN_SECRET = secretKey
REFRESH_TOKEN_SECRET = differentSecretKey
SECRET_AUDIENCE = audience
SECRET_ISSUER = issuer
REFRESH_TOKEN_EXPIRE_IN = 1d

# LOG
LOG_FORMAT = dev
LOG_DIR = ../logs

# CORS
ORIGIN = *
CREDENTIALS = true
```
### Domyślna konfiguracja bazy danych
```ts
export const AppDataSource = new DbContext({
  type: 'mysql',
  host: '127.0.0.1',
  port: 3306,
  username: 'root',
  password: 'admin',
  database: 'dev',
  synchronize: false,
  logging: true,
  entities: [/*tutaj wylistowane wszystkie encje bazodanowe*/],
  subscribers: [],
  namingStrategy: new TitleCaseNamingStrategy(),
  migrationsTableName: '_migrations_history',
  migrations: ['src/dataBase/migrations/*{.ts,.js}'],
});
```

## Testy

### Testy integracyjne

Aby uruchomić testy integracyjne, będąc w folderze ``backend``, uruchom komendę ``npm run test``  
Uwaga: testy integracyjne wykonywane są na bazie danych, na deweloperskiej bazie danych.  
Połączenie do bazy danych skonfigurowane jest w pliku ``backend\src\dataBase\data-source.ts``


### Pokrycie kodu testami

Aby sprawdzić, ile % kodu jest pokryte testami, będąc w folderze ``backend``, uruchom komendę ``npm run test:coverage``  


## Logi

Logi zapisywane są w folderze ``src/logs``