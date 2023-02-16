/** A duel can be either */
export enum DuelState {
  /** Being currently played = 0*/
  PLAYING,
  /** Being paused = 1 */
  PAUSED,
  /** Being done = 2 */
  FINISHED,
}
/**
 * A duel is a timed N-players match.
 */
export interface IDuel {
  /**
   * All player in this match
   */
  players: IPlayer[];

  /**
   * seconds left in this duel
   */
  timeLeft: number;

  /**
   * Playing state
   */
  state: DuelState;

  /**
   * Text channel id,
   */
  channelId: string;

  /**
   * Last time the duel was updated
   */
  lastUpdated?: number;

  /**
   * ID of the message containing the current timer
   */
  timerMessageId?: string;

  /**
   * array which contains numbers ; each number is the value in seconds
   * indicating when the user wants to be notified
   */
  notifyAt?: number[];
}

export interface IPlayer {
  /**
   * Discord ID
   */
  id: string;
  /**
   * Current life point
   */
  lp: number;
}
