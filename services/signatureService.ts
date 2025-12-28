import { supabase } from './supabaseClient'
import { Signature } from '../types'

export interface SignatureInsert {
    handle: string
    comment?: string
    location?: string
}

/**
 * Fetch all signatures, ordered by newest first
 */
export async function fetchSignatures(): Promise<Signature[]> {
    const { data, error } = await supabase
        .from('signatures')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching signatures:', error)
        return []
    }

    return data || []
}

/**
 * Add a new signature to the database using server-side captcha verification
 */
export async function addSignature(sig: SignatureInsert & { captchaToken: string }): Promise<Signature | null> {
    const { data, error } = await supabase.rpc('sign_petition', {
        p_handle: sig.handle,
        p_comment: sig.comment,
        p_location: sig.location,
        p_captcha_token: sig.captchaToken
    });

    if (error || !data?.success) {
        console.error('Error adding signature via RPC:', error || data?.error);
        return null;
    }

    // RPC successful, fetch the newly created row to update UI
    // We filter by handle and order by newest to get the record we just created
    const { data: newSig, error: fetchError } = await supabase
        .from('signatures')
        .select('*')
        .eq('handle', sig.handle)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (fetchError) {
        console.error('Error fetching new signature record:', fetchError);
        return null;
    }

    return newSig;
}

/**
 * Get total signature count (for progress bar)
 */
export async function getSignatureCount(): Promise<number> {
    const { count, error } = await supabase
        .from('signatures')
        .select('*', { count: 'exact', head: true })

    if (error) {
        console.error('Error getting signature count:', error)
        return 0
    }

    return count || 0
}
