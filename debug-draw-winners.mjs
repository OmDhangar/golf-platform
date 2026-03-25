/**
 * Debug script to check why winners aren't being generated
 * Run with: node debug-draw-winners.mjs
 */

import { createAdminClient } from './lib/server/supabase.js';
import { generateRandomNumbers, matchScores } from './lib/server/drawEngine.js';

async function debugDrawWinners() {
  console.log('🔍 Debugging draw winners generation...\n');
  
  const supabase = createAdminClient();
  
  // 1. Get the published draw
  const { data: draw, error: drawError } = await supabase
    .from('draws')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
    
  if (drawError || !draw) {
    console.error('❌ No published draw found');
    return;
  }
  
  console.log('📊 Draw Info:');
  console.log(`  ID: ${draw.id}`);
  console.log(`  Month: ${draw.draw_month}`);
  console.log(`  Winning Numbers: ${draw.winning_numbers}`);
  console.log(`  Active Subscribers: ${draw.active_subscriber_count}`);
  console.log(`  Prize Pool: ₹${draw.prize_pool_total_paise / 100}\n`);
  
  // 2. Get all active subscribers with their scores
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select(`
      id,
      email,
      subscriptions!inner(status),
      scores(value, created_at)
    `)
    .eq('subscriptions.status', 'active');
    
  if (usersError) {
    console.error('❌ Failed to fetch users:', usersError.message);
    return;
  }
  
  console.log(`👥 Found ${users?.length || 0} active subscribers\n`);
  
  // 3. Analyze each user's scores
  const winningNumbers = draw.winning_numbers;
  
  for (const user of users || []) {
    console.log(`👤 User: ${user.email} (${user.id})`);
    
    const latestScores = ((user.scores || []))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
      .map(s => s.value);
    
    console.log(`  Latest 5 scores: [${latestScores.join(', ')}]`);
    console.log(`  Total scores: ${user.scores?.length || 0}`);
    
    if (latestScores.length < 3) {
      console.log(`  ❌ Not enough scores (need at least 3, have ${latestScores.length})`);
      continue;
    }
    
    const { tier, matched } = matchScores(latestScores, winningNumbers);
    console.log(`  Matched numbers: [${matched.join(', ')}] (${matched.length} matches)`);
    console.log(`  Tier: ${tier || 'no winner'}`);
    
    if (tier) {
      console.log(`  🎉 WINNER! Tier: ${tier}`);
    } else {
      console.log(`  ❌ No winning match`);
    }
    console.log('');
  }
  
  // 4. Check winners table
  const { data: winners, error: winnersError } = await supabase
    .from('winners')
    .select('*')
    .eq('draw_id', draw.id);
    
  if (winnersError) {
    console.error('❌ Failed to fetch winners:', winnersError.message);
  } else {
    console.log(`🏆 Winners in database: ${winners?.length || 0}`);
    for (const winner of winners || []) {
      console.log(`  - ${winner.user_id} (${winner.tier} match): ₹${winner.prize_amount_paise / 100}`);
    }
  }
}

debugDrawWinners().catch(console.error);
