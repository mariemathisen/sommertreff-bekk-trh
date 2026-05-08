/**
 * lib/supabase.ts — Supabase client
 *
 * What this file does for the app:
 *   Creates and exports a single Supabase client instance that every page
 *   imports to read data, write data, and subscribe to live updates.
 *   Having one shared client avoids creating unnecessary duplicate connections.
 *
 * Technically:
 *   Supabase is a Backend-as-a-Service (BaaS) built on top of PostgreSQL.
 *   It gives you a hosted database plus two ways to talk to it from the browser:
 *
 *   1. REST API (HTTP requests)
 *      Used for normal reads and writes:
 *        supabase.from('teams').select('*')   → GET  /rest/v1/teams
 *        supabase.from('scores').insert(...)  → POST /rest/v1/scores
 *      HTTP is "ask and answer" — the browser sends a request, the server
 *      responds, and the connection closes. Good for one-off data fetches.
 *
 *   2. WebSocket (persistent connection)
 *      Used for real-time subscriptions on the scoreboard page.
 *      A WebSocket is a long-lived, two-way connection between the browser
 *      and the server. Unlike HTTP, the server can push data to the browser
 *      at any time without the browser asking first.
 *      Supabase uses PostgreSQL's LISTEN/NOTIFY internally: every INSERT,
 *      UPDATE, or DELETE on a subscribed table triggers a notification that
 *      travels over the WebSocket to all connected clients instantly.
 *
 *   Environment variables (NEXT_PUBLIC_...):
 *      Credentials are stored in .env.local and never hard-coded.
 *      The NEXT_PUBLIC_ prefix tells Next.js it is safe to include this
 *      variable in the JavaScript bundle sent to the browser. Without that
 *      prefix the variable would only be available on the server.
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// createClient returns an object with .from(), .channel(), and other helpers
// that abstract away the raw HTTP and WebSocket communication.
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
