/**
 * Crée ou met à jour les comptes de démonstration dans Supabase.
 *
 * Usage:
 *   node scripts/seed-demo-users.js
 *   node scripts/seed-demo-users.js --force   # réinitialise les mots de passe
 */
import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { createClient } from '@supabase/supabase-js'

const force = process.argv.includes('--force')

const DEMO_USERS = [
  {
    email: 'admin@sailingloc.fr',
    password: 'Admin@Sail2026!',
    firstName: 'Admin',
    lastName: 'SailingLoc',
    role: 'ADMIN',
  },
  {
    email: 'owner@demo.fr',
    password: 'Owner@Sail2026!',
    firstName: 'Owner',
    lastName: 'Demo',
    role: 'OWNER',
  },
  {
    email: 'renter@demo.fr',
    password: 'Renter@Sail2026!',
    firstName: 'Renter',
    lastName: 'Demo',
    role: 'RENTER',
  },
]

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Configure SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans backend/.env')
  process.exit(1)
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
)

async function upsertDemoUser({ email, password, firstName, lastName, role }) {
  const normalizedEmail = email.toLowerCase().trim()
  const hashedPassword = await bcrypt.hash(password, 12)

  const { data: existing } = await supabase
    .from('users')
    .select('id, email, role')
    .eq('email', normalizedEmail)
    .maybeSingle()

  if (existing && !force) {
    console.log(`⏭  ${normalizedEmail} existe déjà (role: ${existing.role}) — utilise --force pour réinitialiser le mot de passe`)
    return
  }

  if (existing) {
    const { error } = await supabase
      .from('users')
      .update({
        password: hashedPassword,
        first_name: firstName,
        last_name: lastName,
        role,
        is_blocked: false,
        email_verified_at: new Date().toISOString(),
      })
      .eq('id', existing.id)

    if (error) throw new Error(`${normalizedEmail}: ${error.message}`)
    console.log(`✅ ${normalizedEmail} mis à jour (role: ${role})`)
    return
  }

  const { error } = await supabase.from('users').insert({
    email: normalizedEmail,
    password: hashedPassword,
    first_name: firstName,
    last_name: lastName,
    role,
    is_blocked: false,
    email_verified_at: new Date().toISOString(),
    terms_accepted_at: new Date().toISOString(),
  })

  if (error) throw new Error(`${normalizedEmail}: ${error.message}`)
  console.log(`✅ ${normalizedEmail} créé (role: ${role})`)
}

async function main() {
  console.log('🌱 Seed comptes de démonstration SailingLoc\n')

  for (const user of DEMO_USERS) {
    await upsertDemoUser(user)
  }

  console.log('\n📋 Identifiants de connexion (http://localhost:5173/connexion):\n')
  for (const u of DEMO_USERS) {
    console.log(`   ${u.role.padEnd(6)} → ${u.email} / ${u.password}`)
  }
  console.log('\n   Admin → http://localhost:5173/admin\n')
}

main().catch((err) => {
  console.error('❌', err.message)
  process.exit(1)
})
