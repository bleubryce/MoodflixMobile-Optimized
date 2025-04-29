import { Movie } from './movie';
import { User } from './auth';
import { NotificationPreferences } from './notifications';
import { OfflineState } from './offline';
import { WatchParty } from './watchParty';

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  ActivityFeed: undefined;
  MovieDetail: { movieId: number };
};

export type AuthStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Search: undefined;
  WatchParty: undefined;
  Profile: undefined;
};

export type HomeStackParamList = {
  HomeScreen: undefined;
  MovieDetails: { movie: Movie };
  WatchPartyDetails: { partyId: string };
};

export type SearchStackParamList = {
  SearchScreen: undefined;
  MovieDetails: { movie: Movie };
  WatchPartyDetails: { partyId: string };
};

export type WatchPartyStackParamList = {
  WatchPartyList: undefined;
  WatchPartyDetails: { partyId: string };
  CreateWatchParty: { movie: Movie };
};

export type ProfileStackParamList = {
  ProfileScreen: undefined;
  EditProfile: undefined;
  NotificationSettings: undefined;
  OfflineSettings: undefined;
  About: undefined;
};

export type IconName = 
  | 'home'
  | 'search'
  | 'movie'
  | 'person'
  | 'settings'
  | 'notifications'
  | 'favorite'
  | 'favorite-border'
  | 'play-arrow'
  | 'pause'
  | 'skip-next'
  | 'skip-previous'
  | 'volume-up'
  | 'volume-off'
  | 'fullscreen'
  | 'fullscreen-exit'
  | 'close'
  | 'menu'
  | 'arrow-back'
  | 'arrow-forward'
  | 'add'
  | 'remove'
  | 'edit'
  | 'delete'
  | 'share'
  | 'more-vert'
  | 'more-horiz'
  | 'check'
  | 'clear'
  | 'refresh'
  | 'error'
  | 'warning'
  | 'info'
  | 'help'
  | 'visibility'
  | 'visibility-off'
  | 'lock'
  | 'lock-open'
  | 'person-add'
  | 'group'
  | 'chat'
  | 'email'
  | 'phone'
  | 'location-on'
  | 'schedule'
  | 'event'
  | 'star'
  | 'star-border'
  | 'star-half'
  | 'thumb-up'
  | 'thumb-down'
  | 'comment'
  | 'forum'
  | 'tag'
  | 'label'
  | 'bookmark'
  | 'bookmark-border'
  | 'history'
  | 'schedule'
  | 'today'
  | 'update'
  | 'access-time'
  | 'timer'
  | 'alarm'
  | 'alarm-add'
  | 'alarm-off'
  | 'alarm-on'
  | 'timer-10'
  | 'timer-3'
  | 'timer-off'
  | 'timer-on'
  | 'hourglass-empty'
  | 'hourglass-full'
  | 'hourglass-half'
  | 'hourglass-top'
  | 'hourglass-bottom'
  | 'hourglass-disabled'
  | 'hourglass-enabled'
  | 'hourglass-start'
  | 'hourglass-end'
  | 'hourglass-mid'
  | 'hourglass-mid-empty'
  | 'hourglass-mid-full'
  | 'hourglass-mid-half'
  | 'hourglass-mid-top'
  | 'hourglass-mid-bottom'
  | 'hourglass-mid-disabled'
  | 'hourglass-mid-enabled'
  | 'hourglass-mid-start'
  | 'hourglass-mid-end'; 