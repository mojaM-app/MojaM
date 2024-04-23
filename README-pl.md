# MojaM

![pl](https://img.shields.io/badge/lang-pl-red.svg)

## Back-end

Aplikacja napisana w TypeScript, uruchamiana w środowisku NodeJS  
Korzysta z bazy danych MySQL, przed uruchomieniem proszę przygotować poprawnie skonfigurowaną bazę MySQL  
Połączenie do bazy realizowane jest za pomocą [ORM Prisma](https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/introduction).  

## Instalacja
1. W konsoli wejdź do folderu ``backend``
2. Będąc w folderze ``backend`` uruchom komendę ``npm run init``
3. Otwórz plik ``.env.development.local`` i ustaw zmienne środowiskowe (domyślna konfiguracja poniżej). Sprawdź połączenie z bazą danych.
5. Utwórz bazę danych i niezbędne tabele, w tym celu będąc w folderze ``backend`` uruchom komendę ``npm run prisma:reset``. Komenda ta tworzy bazę (jeżeli istnieje już baza o podanej nazwie to ją usuwa) a następnie wpisuje do bazy dane testowe.
6. Uruchom aplikację komendą ``npm run dev``

### Domyślne zmienne środowiskowe

```ini
# PORT
PORT = 5100

# DATABASE
DATABASE_URL= mysql://root:admin@localhost:3306/dev

# TOKEN
SECRET_KEY = secretKey
SECRET_AUDIENCE = audience
SECRET_ISSUER = issuer

# LOG
LOG_FORMAT = dev
LOG_DIR = ../logs

# CORS
ORIGIN = *
CREDENTIALS = true
```
``DATABASE_URL`` zawiera informacje na temat połączenia do bazy danych.  
Sprawdź jakie są Twoje paramety połączenia się z bazą danych a następnie ustaw je w pliku ``.env.development.local``  
Powyższe poświadczenia to: login: ``root`` i hasło: ``admin``  
Sprawdź też czy port pod którym dostępna jest Twoja baza danych jest poprawny (powyżej nr portu: ``3306``).  
Nazwa bazy danych: ``dev``

## Testy

### Testy integracyjne

Aby uruchomić testy integracyjne, będąc w folderze ``backend``, uruchom komendę ``npm run test``  
Uwaga: testy integracyjne wykonywane są na bazie danych, na deweloperskiej bazie danych.  
Połączenie do deweloperskiej bazy danych konfigurowane jest w pliku ``.env.development.local``


### Pokrycie kodu testami

Aby sprawdzić, ile % kodu jest pokryte testami, będąc w folderze ``backend``, uruchom komendę ``npm run test:coverage``  


## Logi

Logi zapisywane są w folderze ``src/logs``