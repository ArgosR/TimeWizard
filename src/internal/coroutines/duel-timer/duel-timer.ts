import { ICoroutine } from "../coroutune-api";
import { inject, injectable } from "inversify";
import { TYPES } from "../../../types";
import { IDuelManager } from "../../../pkg/duel-manager/duel-manager.api";
import { ILogger } from "../../../pkg/logger/logger-api";
import { setInterval } from "timers/promises";
import { DuelState, IDuel } from "../../../pkg/duel-manager/model/duel";
import { Client, TextChannel } from "discord.js";

@injectable()
export class DuelTimer implements ICoroutine {
  // How much time to wait before each update
  private static readonly INTERVAL = 5 * 1000;
  // How much time to wait before starting the scheduler
  private static readonly BOOT_DELAY = 5 * 1000;
  // Logging prefix
  private static readonly logPre = "[Coroutine : Duel updater] ::";
  constructor(
    @inject(TYPES.DiscordClientProvider) private clientProvider: () => Client,
    @inject(TYPES.Logger) private logger: ILogger,
    @inject(TYPES.DuelManager) private duelMgr: IDuelManager
  ) {}

  /**
   * Run once at the coroutine initialization
   */
  async start(): Promise<void> {
    void this.init();

    // On start : Reset all the
    // Get all running duels
    // For each one, update their timer in their respective chat
    // store changes
    await setTimeout(
      () => this.startDuelUpdateScheduler(DuelTimer.INTERVAL),
      DuelTimer.BOOT_DELAY
    );

    this.logger.info(`${DuelTimer.logPre} Successfully started`);
  }

  /**
   * Asynchronously update a duel state
   * @param quantum
   */
  async startDuelUpdateScheduler(quantum: number) {
    // At each quantum of time...
    for await (const tick of setInterval(quantum)) {
      const currDate = new Date().getTime();
      let duels = await this.duelMgr.getAll();
      // Get rid of the finished duels
      duels = duels.filter((d) => d.state !== DuelState.FINISHED);
      // For each duel still running...
      for (const d of duels) {
        if (d.state !== DuelState.PLAYING) continue;
        // We calculate how much time has passed since the last update
        const diffSec = Math.abs(currDate - d.lastUpdated) / 1000;
        // And remove it from the timeLeft for the duel
        d.timeLeft = Math.max(0, d.timeLeft - diffSec);
        // If it hits 0, the duel is finished
        if (d.timeLeft === 0) d.state = DuelState.FINISHED;
        d.lastUpdated = currDate;
      }
      // And save the changes
      await this.duelMgr.clobber(duels);

      // Update users UI without waiting
      void this.notifyChannels(duels);
    }
  }

  /**
   * Update the timer in each discord channel for ecah duel
   * @param duels
   */
  async notifyChannels(duels: IDuel[]) {
    const disc = await this.clientProvider();

    const notifyPromises = duels.map(async (d) => {
      // Grab the original channel from its id
      const channel = (await disc.channels.fetch(d.channelId)) as TextChannel;

      // Nothing to do on a paused duel
      if (d.state === DuelState.PAUSED) return;

      let formatStr = "";
      //On récupère les deux joueurs
      const joueur_1 = d.players[0];
      const joueur_2 = d.players[1];
      //On récupère leurs LP actuels
      const joueur_1LP = joueur_1.lp;
      const joueur_2LP = joueur_2.lp;
      // on vérifie que les LP des joueurs sont toujours au dessus de 0, sinon on arrête le duel
      if (joueur_1LP == 0 || joueur_2LP == 0) {
        //this.logger.debug("on est dans la boucle : un des joueurs à 0 LP");
        d.state = DuelState.FINISHED;
        await this.duelMgr.save(d);
      }

      /*TODO : on veut récupérer la taille du pseudo du premier joueur pour avoir un affichage uniforme
        const user1 = joueur_1.id.fetch();
        const lg_us1 = user1.username.length()-joueur_1LP.tostring().length();

        
      */

      if (d.state === DuelState.PLAYING) {
        formatStr = `${joueur_1LP}  | ${joueur_2LP}
Temps restant : ${this.formatSeconds(d.timeLeft)}
        `;
      } else if (d.state === DuelState.FINISHED) formatStr = `Terminé !`;
      // We can either create a message or edit one
      if (d.timerMessageId === undefined) {
        // In case of a new message, we make sure to reflect this change in the cache
        // for the next sweep to be able to edit it
        const newMessage = await channel.send(formatStr);
        d.timerMessageId = newMessage.id;
        await this.duelMgr.save(d);
      } else {
        const existingMessage = await channel.messages.fetch(d.timerMessageId);
        await existingMessage.edit(formatStr);
      }
    });

    // Log any error happening during the notification process
    const notifs = await Promise.allSettled(notifyPromises);
    const errorPrefix = `${DuelTimer.logPre} Error during notification :`;
    notifs
      .filter((n) => n.status === "rejected")
      .forEach((rej: PromiseRejectedResult) =>
        this.logger.error(errorPrefix + rej.reason)
      );
  }

  async init() {
    // On boot, we update every duel with a new lastUpdated date, to keep the prevent having errors
    // after a long pause of reboot
    const duels = await this.duelMgr.getAll();
    if (duels.length === 0) return;
    this.logger.debug(
      `${DuelTimer.logPre} Got ${duels.length} duel back in schedule`
    );
    const current = new Date().getTime();
    duels.forEach((d) => (d.lastUpdated = current));
    await this.duelMgr.clobber(duels);
  }

  /***
   * Format a number of seconds to hh:mm:ss format
   * @param s
   */
  formatSeconds(s: number): string {
    const hours = Math.floor(s / 3600);
    const minutes = Math.floor((s - hours * 3600) / 60);
    const seconds = Math.floor(s - hours * 3600 - minutes * 60);
    const prefix = (n: number) => (n < 10 ? `0${n}` : n);
    return `${prefix(minutes)}min ${prefix(seconds)}s`;
    //return `${prefix(hours)}:${prefix(minutes)}:${prefix(seconds)}`;
  }
}
