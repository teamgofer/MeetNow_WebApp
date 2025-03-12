import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createPost, getNearbyPosts, getPostReplies, getUserPosts } from '@/lib/post';

export async function POST(request: Request) {
  try {
    const headersList = headers();
    const userId = parseInt(headersList.get('X-User-Id') || '0');
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const result = await createPost({ ...data, userId });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.post);
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const headersList = headers();
    const userId = parseInt(headersList.get('X-User-Id') || '0');

    const type = searchParams.get('type');
    
    switch (type) {
      case 'nearby': {
        const lat = parseFloat(searchParams.get('lat') || '0');
        const lng = parseFloat(searchParams.get('lng') || '0');
        const radius = parseInt(searchParams.get('radius') || '5000');
        
        if (!lat || !lng) {
          return NextResponse.json(
            { error: 'Location required' },
            { status: 400 }
          );
        }

        const posts = await getNearbyPosts({
          location: { lat, lng },
          userId,
          radius
        });

        return NextResponse.json(posts);
      }

      case 'replies': {
        const postId = parseInt(searchParams.get('postId') || '0');
        if (!postId) {
          return NextResponse.json(
            { error: 'Post ID required' },
            { status: 400 }
          );
        }

        const replies = await getPostReplies(postId);
        return NextResponse.json(replies);
      }

      case 'user': {
        const targetUserId = parseInt(searchParams.get('userId') || '0');
        if (!targetUserId) {
          return NextResponse.json(
            { error: 'User ID required' },
            { status: 400 }
          );
        }

        const posts = await getUserPosts(targetUserId);
        return NextResponse.json(posts);
      }

      default:
        return NextResponse.json(
          { error: 'Invalid request type' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 