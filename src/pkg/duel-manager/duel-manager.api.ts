import { IDuel, IPlayer } from "./model/duel";

export class DuelError extends Error {}

export interface IDuelManager {
  /**
   * Return true if this player is currently dueling someone
   * @param duel
   */
  isDueling(p: IPlayer["id"]): Promise<boolean>;

  /**
   * Save a duel. If this duel already exists, updates it, else creates it.
   * @param d
   */
  save(d: IDuel): Promise<void>;

  /**
   * Return all duels involving all players ids provided.
   * Ex : Passing one ID would return every duel for this player
   * Passing two IDs would return every duel involving BOTH p1 and p2 at the same time
   * @param pIds Ids of all players involved
   */
  getFor(...pIds: IPlayer["id"][]): Promise<IDuel[]>;

  /**
   * Return all currently played duels
   */
  getAll(): Promise<IDuel[]>;

  /**
   * Forcibly replace all duels in memory with the ones provided
   * @param duels
   */
  clobber(duels: IDuel[]): Promise<void>;
}
