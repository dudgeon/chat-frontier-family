# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/a746dae1-d079-4ba9-ad29-1a31653890b4

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/a746dae1-d079-4ba9-ad29-1a31653890b4) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Configuration

The application expects the following environment variables when running in the browser:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
VITE_OPENAI_MODEL=gpt-4o
```

`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` configure the Supabase connection.
`VITE_OPENAI_MODEL` sets the model used by the edge functions when contacting
OpenAI.

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/a746dae1-d079-4ba9-ad29-1a31653890b4) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## Deployment

This project uses GitHub Actions to automatically deploy Supabase Edge Functions whenever code under `functions/` changes:

- **Workflow file:** `.github/workflows/deploy-functions.yml`  
- **Triggers:**
  - Push to the `main` branch affecting `functions/**`
  - Manual dispatch via the **Actions** tab  
- **Required repository secrets:**
  - `SUPABASE_ACCESS_TOKEN` – Your Supabase Service Role Key  
  - `SUPABASE_PROJECT_ID` – Your Supabase Project Reference  
- **What happens:**
  1. Checks out the repo  
  2. Installs the Supabase CLI  
  3. Authenticates with your service role key  
  4. Deploys all functions in `functions/`  
- **To manually run:** Go to **Actions ➔ Deploy Supabase Edge Functions** and click **Run workflow**.

## Database Schema

The Supabase database schema used by this project is provided in
[`schema.json`](schema.json) for reference.
