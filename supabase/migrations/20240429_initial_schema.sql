-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  notification_preferences JSONB DEFAULT '{}'::jsonb,
  preferences JSONB DEFAULT '{
    "favorite_genres": [],
    "preferred_languages": ["en"],
    "content_rating": []
  }'::jsonb
);

-- Create activities table
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create friend_connections table
CREATE TABLE IF NOT EXISTS friend_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  friend_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, friend_id)
);

-- Create friend_requests table
CREATE TABLE IF NOT EXISTS friend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(sender_id, receiver_id)
);

-- Create user_blocks table
CREATE TABLE IF NOT EXISTS user_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  blocked_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(blocker_id, blocked_id)
);

-- Create watch_parties table
CREATE TABLE IF NOT EXISTS watch_parties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  movie_id TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'paused', 'ended')) NOT NULL,
  current_time INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create watch_party_participants table
CREATE TABLE IF NOT EXISTS watch_party_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id UUID REFERENCES watch_parties(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(party_id, user_id)
);

-- Create watch_party_messages table
CREATE TABLE IF NOT EXISTS watch_party_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id UUID REFERENCES watch_parties(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create RLS policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE watch_parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE watch_party_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE watch_party_messages ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Activities policies
CREATE POLICY "Activities are viewable by everyone" ON activities
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own activities" ON activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Friend connections policies
CREATE POLICY "Users can view their own friend connections" ON friend_connections
  FOR SELECT USING (auth.uid() IN (user_id, friend_id));

CREATE POLICY "Users can insert their own friend connections" ON friend_connections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own friend connections" ON friend_connections
  FOR DELETE USING (auth.uid() IN (user_id, friend_id));

-- Friend requests policies
CREATE POLICY "Users can view their own friend requests" ON friend_requests
  FOR SELECT USING (auth.uid() IN (sender_id, receiver_id));

CREATE POLICY "Users can insert their own friend requests" ON friend_requests
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update friend requests they received" ON friend_requests
  FOR UPDATE USING (auth.uid() = receiver_id);

-- User blocks policies
CREATE POLICY "Users can view their own blocks" ON user_blocks
  FOR SELECT USING (auth.uid() = blocker_id);

CREATE POLICY "Users can insert their own blocks" ON user_blocks
  FOR INSERT WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can delete their own blocks" ON user_blocks
  FOR DELETE USING (auth.uid() = blocker_id);

-- Watch parties policies
CREATE POLICY "Watch parties are viewable by participants" ON watch_parties
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM watch_party_participants
      WHERE party_id = id AND user_id = auth.uid()
    ) OR host_id = auth.uid()
  );

CREATE POLICY "Users can create watch parties" ON watch_parties
  FOR INSERT WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Hosts can update their watch parties" ON watch_parties
  FOR UPDATE USING (auth.uid() = host_id);

-- Watch party participants policies
CREATE POLICY "Watch party participants are viewable by other participants" ON watch_party_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM watch_party_participants wpp
      WHERE wpp.party_id = party_id AND wpp.user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM watch_parties wp
      WHERE wp.id = party_id AND wp.host_id = auth.uid()
    )
  );

CREATE POLICY "Users can join watch parties" ON watch_party_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave watch parties" ON watch_party_participants
  FOR DELETE USING (auth.uid() = user_id);

-- Watch party messages policies
CREATE POLICY "Watch party messages are viewable by participants" ON watch_party_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM watch_party_participants
      WHERE party_id = party_id AND user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM watch_parties
      WHERE id = party_id AND host_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages to watch parties they're in" ON watch_party_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM watch_party_participants
      WHERE party_id = party_id AND user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM watch_parties
      WHERE id = party_id AND host_id = auth.uid()
    )
  );

-- Functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.email
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user(); 