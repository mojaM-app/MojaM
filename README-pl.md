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
4. Utwórz bazę danych i niezbędne tabele, w tym celu będąc w folderze ``backend`` uruchom komendę ``npm run migration:run``. Komenda ta uruchamia migracje SQL.
6. Uruchom aplikację komendą ``npm run dev``

### Domyślne zmienne środowiskowe
```ini
# PORT
PORT = 5100
BASE_PATH = /api

# DATABASE
DATABASE_HOST = localhost
DATABASE_PORT = 3306
DATABASE_USERNAME = admin
DATABASE_PASSWORD = admin
DATABASE_NAME = dev
DATABASE_MIGRATIONS_PATH =

# TOKEN
ACCESS_TOKEN_SECRET = secretKey
REFRESH_TOKEN_SECRET = differentSecretKey
SECRET_AUDIENCE = audience
SECRET_ISSUER = issuer
REFRESH_TOKEN_EXPIRE_IN = 1d

# CLIENT APP
CLIENT_APP_URL =
COMMUNITY_INFO_URL =

# SMTP service configuration
SMTP_SERVICE_HOST =
SMTP_SERVICE_PORT =
SMTP_USER_NAME =
SMTP_USER_PASSWORD =

#NOTIFICATION TEMPLATE VARIABLES
TPL_VAR_APP_NAME = 'MyApp'
TPL_VAR_CONTACT_EMAIL = 'contact@myapp.com'
TPL_VAR_CONTACT_PHONE = '123-456-789'
TPL_VAR_CONTACT_WEBSITE = 'MyApp.com'
TPL_VAR_RESET_PASSWORD_TITLE = 'Reset hasła do aplikacji MyApp.com'
TPL_VAR_RESET_PIN_TITLE = 'Reset kodu PIN do aplikacji MyApp.com'
TPL_VAR_WELCOME_EMAIL_TITLE = 'Witaj w aplikacji MyApp.com'
TPL_VAR_ACCOUNT_BLOCKED_EMAIL_TITLE = 'Blokada konta w aplikacji MyApp.com'

#NOTIFICATIONS
NOTIFICATIONS_EMAIL =
RESET_PASSWORD_TOKEN_EXPIRE_IN = 1h

#GOOGLE API KEY
#according to https://www.youtube.com/watch?v=zrLf4KMs71E
GOOGLE_API_CLIENT_ID =
GOOGLE_API_CLIENT_SECRET =
GOOGLE_API_REFRESH_TOKEN =

#GOOGLE CALENDAR API
GOOGLE_CALENDAR_ID = primary

# LOG
LOG_FORMAT = dev
LOG_DIR = ../../logs

# CORS
ORIGIN = *
CREDENTIALS = true

# ADMIN USER DETAILS
ADMIN_EMAIL =
ADMIN_PASSWORD =
ADMIN_UUID =
```
### Domyślna konfiguracja bazy danych
```ts
{
  type: 'mysql',
  host: DATABASE_HOST,
  port: toNumber(DATABASE_PORT)!,
  username: DATABASE_USERNAME,
  password: DATABASE_PASSWORD,
  database: DATABASE_NAME,
  synchronize: false,
  logging: true,
  entities: [/*tutaj wylistowane wszystkie encje bazodanowe*/],
  subscribers: [],
  namingStrategy: new TitleCaseNamingStrategy(),
  migrationsTableName: '_migrations_history',
  migrations: [DATABASE_MIGRATIONS_PATH!],
}
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