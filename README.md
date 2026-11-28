# MtgChecker

**A full-stack Magic: The Gathering companion for card search, collection tracking, deck building, card scanning, rules lookup, and multiplayer life tracking.**

MtgChecker combines a Spring Boot REST API with a React Native application built using Expo. The backend integrates with Scryfall for card data and uses PostgreSQL and Redis for persistent storage, caching, and request controls. An optional n8n workflow connects the rules assistant to an AI provider.

## Features

- **Card search** with printing details, prices, legality, filters, and autocomplete powered by Scryfall data.
- **Collection and portfolio tracking** with printing-level ownership, finish and condition, purchase price, and collection summaries.
- **Deck building** with format-aware legality information, commander details, mana curve analysis, and local-first editing with cloud synchronization.
- **Card scanning** using the device camera, OCR, and set/collector-number lookup.
- **Rules assistant** that routes questions through an n8n webhook to an AI provider configured in the workflow.
- **Multiplayer life tracker** for two to four players, including poison counters, commander damage, energy, dice, and match history.
- **Authentication and authorization** using JWT and configurable multi-role permissions.
- **Rate limiting and caching** with Redis support and in-process fallback behavior.

## Technology

| Area | Technologies |
| --- | --- |
| Backend | Java 21, Spring Boot 3.3, Spring Security, Spring Data JPA, Spring Data Redis |
| Data | PostgreSQL 17, H2 for local development, Flyway |
| Mobile app | React Native, Expo SDK 58, TypeScript, Expo Router |
| Card data | Scryfall API and database-backed card cache |
| Scanning | OpenCV, Tesseract OCR |
| AI workflow | n8n webhook with a workflow-configured AI provider |
| Deployment | Docker Compose, Nginx, GitHub Actions self-hosted runner |

## Architecture

```text
Expo mobile app
      │ HTTPS / REST
      ▼
Nginx reverse proxy ──► Spring Boot API
                             ├── PostgreSQL
                             ├── Redis
                             ├── Scryfall API
                             └── n8n webhook ──► AI provider
```

The mobile app keeps its presentation and navigation separate from feature APIs. The backend organizes domain code by accounts, cards, decks, inventory, and rules, with controller, service, repository, and DTO layers. Card lookups use a database cache before reaching Scryfall. The rules assistant is an optional integration and depends on an active n8n workflow and valid provider credentials.

## Repository layout

```text
MtgChecker/
├── MtgChecker/       Spring Boot API and Docker Compose configuration
├── MtgCheckerApp/    Expo mobile application
├── n8n/              Importable AI rules workflow
└── README.md
```

## Run locally

### Backend services

Requirements include Docker with the Compose plugin and Java 21 for running the API outside Docker.

```bash
cd MtgChecker
cp .env.example .env
```

Edit `.env` and replace development values with local credentials. Set a strong `JWT_SECRET`, database and Redis passwords, and configure the n8n webhook secret if the AI workflow is enabled. Keep `.env` private and out of version control.

Start the stack:

```bash
docker compose up --build -d
```

The API is exposed on port `8081` by default and Swagger UI is available at `http://localhost:8081/swagger-ui.html`. PostgreSQL is bound to localhost on port `5433` by default. Docker Compose also defines Redis, Nginx, and n8n. The AI workflow and its provider credentials need to be configured in n8n before using AI rules features.

To run the backend directly with the Maven wrapper:

```bash
cd MtgChecker
./mvnw spring-boot:run
```

On Windows, use `mvnw.cmd spring-boot:run`. Set the required datasource and service environment variables for your local setup.

### Mobile application

Requirements include Node.js and npm.

```bash
cd MtgCheckerApp
npm install
```

Create a local `.env` from `.env.example` and set `EXPO_PUBLIC_API_BASE_URL` to the backend address reachable by your device. For a physical phone, use the computer's LAN address during local development. For production, use the public HTTPS API URL. Then start Expo:

```bash
npm start
```

Use `npm run android`, `npm run ios`, or `npm run web` for the corresponding development target. Android and iOS device builds require the relevant Expo native build setup.

### Import the n8n workflow

Import `n8n/mtg_judge_workflow.json` into your n8n instance, configure the AI provider credential and webhook authentication, then activate the workflow. Configure the backend's `N8N_WEBHOOK_URL` and `N8N_API_SECRET` to match that instance. Never commit provider API keys or webhook secrets.

## API overview

The REST API is versioned under `/api/v1`. Main resource groups include:

| Resource | Path |
| --- | --- |
| Authentication | `/auth` |
| Accounts and roles | `/accounts`, `/roles` |
| Cards, sets, and rulings | `/cards`, `/sets`, `/rulings` |
| Inventory | `/inventory` |
| Decks and formats | `/decks`, `/deck-formats` |
| Rules assistant and rules data | `/rules` |

OpenAPI documentation is served by SpringDoc at `/swagger-ui.html` when the backend is running.

## CI and deployment

The repository includes a GitHub Actions workflow for the `main` branch. It builds the backend with Java 21 and deploys the Docker Compose stack on a self-hosted runner. The runner must have Docker access and a deployment `.env` configured outside the repository.

## Project status

MtgChecker is an actively developed portfolio project. The mobile client runs through Expo and can be packaged for Android with an appropriate native build configuration. Optional integrations such as AI rules responses require external service configuration.

## Author

**The Vinh Ly**  
Java Backend Developer

GitHub: [Lag500ms](https://github.com/Lag500ms)

## Acknowledgements

- Card data provided by [Scryfall](https://scryfall.com/docs/api).
- Magic: The Gathering is a trademark of Wizards of the Coast. MtgChecker is an independent fan-made project and is not affiliated with or endorsed by Wizards of the Coast.
