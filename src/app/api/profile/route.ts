import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userProfile } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const profile = await db.select()
      .from(userProfile)
      .where(eq(userProfile.userId, session.user.id))
      .limit(1);

    if (profile.length === 0) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json(profile[0]);
  } catch (error) {
    console.error('GET profile error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const requestBody = await request.json();

    // Security check: reject if userId provided in body
    if ('userId' in requestBody || 'user_id' in requestBody) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    const { age, dob, contact, address, city, state, country } = requestBody;

    // Validation
    if (age !== undefined && (typeof age !== 'number' || age < 0 || !Number.isInteger(age))) {
      return NextResponse.json({ 
        error: "Age must be a positive integer",
        code: "INVALID_AGE" 
      }, { status: 400 });
    }

    if (contact !== undefined && contact !== null && contact !== '') {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      const cleanContact = contact.toString().replace(/[\s\-\(\)]/g, '');
      if (!phoneRegex.test(cleanContact)) {
        return NextResponse.json({ 
          error: "Invalid phone format",
          code: "INVALID_CONTACT" 
        }, { status: 400 });
      }
    }

    // Sanitize inputs
    const sanitizedData = {
      ...(age !== undefined && { age }),
      ...(dob !== undefined && { dob: dob?.trim() }),
      ...(contact !== undefined && { contact: contact?.trim() }),
      ...(address !== undefined && { address: address?.trim() }),
      ...(city !== undefined && { city: city?.trim() }),
      ...(state !== undefined && { state: state?.trim() }),
      ...(country !== undefined && { country: country?.trim() })
    };

    // Check if profile exists
    const existingProfile = await db.select()
      .from(userProfile)
      .where(eq(userProfile.userId, session.user.id))
      .limit(1);

    if (existingProfile.length > 0) {
      // Update existing profile
      const updated = await db.update(userProfile)
        .set({
          ...sanitizedData,
          updatedAt: new Date().toISOString()
        })
        .where(eq(userProfile.userId, session.user.id))
        .returning();

      return NextResponse.json(updated[0]);
    } else {
      // Create new profile
      const newProfile = await db.insert(userProfile)
        .values({
          userId: session.user.id,
          ...sanitizedData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .returning();

      return NextResponse.json(newProfile[0], { status: 201 });
    }
  } catch (error) {
    console.error('PUT profile error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}