import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const url = process.env.TEST_APP_URL || 'http://localhost:5173';
const supabaseUrl = process.env.SUPABASE_URL as string;
const anonKey = process.env.SUPABASE_ANON_KEY as string;

const supabase = createClient(supabaseUrl, anonKey);

test.skip('metadata updates after third assistant reply', async ({ page }) => {
  await page.goto(url);

  const input = page.locator('textarea');
  await input.fill('first');
  await input.press('Enter');
  await page.locator('.assistant-msg').nth(0).waitFor();

  await input.fill('second');
  await input.press('Enter');
  await page.locator('.assistant-msg').nth(1).waitFor();

  await input.fill('third');
  await input.press('Enter');
  await page.locator('.assistant-msg').nth(2).waitFor();

  const titleEl = page.locator('[data-testid="chat-title"]');
  await expect(titleEl).not.toHaveText('first');

  const { data } = await supabase
    .from('chat_sessions')
    .select('name, session_summary')
    .order('last_updated', { ascending: false })
    .limit(1)
    .single();

  expect(data?.name).not.toBe('first');
  expect(data?.session_summary).toBeTruthy();
});
