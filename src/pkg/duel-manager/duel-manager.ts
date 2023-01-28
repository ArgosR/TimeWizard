import { DuelError, IDuelManager } from "./duel-manager.api";
import { DuelState, IDuel, IPlayer } from "./model/duel";
import { inject } from "inversify";
import { TYPES } from "../../types";
import { IRecordingStore } from "../../internal/state-store/state-store.api";

export class DuelManager implements IDuelManager {
  constructor(
    /** External storage for duels */
    @inject(TYPES.BotStateStore) private store: IRecordingStore<IDuel[]>
  ) {}
  async getAll(): Promise<IDuel[]> {
    return (await this.store.getState()) ?? [];
  }

  async getFor(...pIds: IPlayer["id"][]): Promise<IDuel[]> {
    const duels = await this.getAll();
    // Only return duels including the target players
    return duels.filter((d) => d.players.some((pl) => pIds.includes(pl.id)));
  }

  async isDueling(p: IPlayer["id"]): Promise<boolean> {
    // From all duels...
    const duels = await this.getAll();
    if (duels.length === 0) return false;
    // Only keep the one being currently played...
    const activeDuels = duels.filter((d) => d.state === DuelState.PLAYING);
    // And check if the target player is included in any of them
    return activeDuels.some((d) => d.players.some((pl) => pl.id === p));
  }

  /**
   * Sanity check for a new duel
   * @param d
   */
  async checkForInsertion(d: IDuel) {
    // Check if any player involved in the current duel isn't also involved in another active duel
    const conflicts = (
      await Promise.all(d.players.map(async (p) => await this.isDueling(p.id)))
    ).filter((dueling) => dueling);
    if (conflicts.length !== 0) {
      throw new DuelError(`Some players are currently involved in a duel !`);
    }
    // Check if the duel has a lastUpdatedDate, else sets it
    if (d.lastUpdated === undefined) d.lastUpdated = new Date().getTime();
  }

  /**
   * Return the index of an existing duel, -1 if not found
   */
  async findIndex(cd: IDuel): Promise<number> {
    // As only one active duel can occur between the same set of players,
    // We can check if the duel actually exists by checking the player Ids
    const pIds = cd.players.map((p) => p.id);
    const duels = await this.getAll();
    return duels.findIndex((d) =>
      pIds.every((pId) => d.players.map((p) => p.id).includes(pId))
    );
  }

  async save(d: IDuel): Promise<void> {
    const release = await this.store.getLock();
    try {
      const index = await this.findIndex(d);
      const duels = await this.getAll();
      // Not found, it is a new duel
      if (index === -1) {
        await this.checkForInsertion(d);
        duels.push(d);
      }
      // Found, update the existing duel
      else {
        duels[index] = d;
      }
      await this.store.setState(duels);
    } finally {
      await release();
    }
  }

  async clobber(duels: IDuel[]) {
    const release = await this.store.getLock();
    try {
      await this.store.setState(duels);
    } finally {
      await release();
    }
  }
}
