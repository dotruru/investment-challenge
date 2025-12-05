Deployment Guide
Option 1: Railway + Vercel (Recommended for your use case)
Step 1: Deploy Backend to Railway
# 1. Install Railway CLInpm install -g @railway/cli# 2. Loginrailway login# 3. Initialize projectcd /Users/arukanussipzhan/Desktop/investment-competitionrailway init# 4. Add PostgreSQLrailway add postgresql# 5. Add Redisrailway add redis# 6. Set environment variables in Railway dashboard:
Required Railway Environment Variables:
# 1. Install Railway CLInpm install -g @railway/cli# 2. Loginrailway login# 3. Initialize projectcd /Users/arukanussipzhan/Desktop/investment-competitionrailway init# 4. Add PostgreSQLrailway add postgresql# 5. Add Redisrailway add redis# 6. Set environment variables in Railway dashboard:
JWT_SECRET=<generate-random-64-chars>JWT_REFRESH_SECRET=<generate-another-random-64-chars>OPERATOR_PIN=<your-secret-pin>CORS_ORIGINS=https://your-operator.vercel.app,https://your-audience.vercel.appNODE_ENV=production
Step 2: Deploy Frontends to Vercel
Operator Panel:
# 7. Deployrailway up
Audience Screen (separate Vercel project):
cd frontendvercel --prod# When prompted, set root directory to: frontend# Set build command: npm run build:operator# Set output directory: dist/operator
Vercel Environment Variables:
vercel --prod# Set build command: npm run build:audience  # Set output directory: dist/audience
