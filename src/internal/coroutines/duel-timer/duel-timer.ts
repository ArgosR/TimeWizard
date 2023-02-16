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
        // If it hits 0 OR Lp=0, the duel is finished

        if (d.timeLeft === 0 || d.players.some((p) => p.lp == 0))
          d.state = DuelState.FINISHED;

        d.lastUpdated = currDate;
      }
      // And save the changes
      await this.duelMgr.clobber(duels);

      // Update users UI without waiting
      void this.notifyChannels(duels);
    }
  }

  /**
   * Update the timer in each discord channel for each duel
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

      /*TODO : on veut récupérer la taille du pseudo du premier joueur pour avoir un affichage uniforme
        
      */
      // on a l'ID du joueur
      const iduser1 = d.players[0].id;
      // user discord qui correspond a cet ID
      const user = await disc.users.fetch(iduser1);

      // on a l'ID du joueur 2
      const iduser2 = d.players[1].id;
      // user discord qui correspond a cet ID
      const user2 = await disc.users.fetch(iduser2);

      //on récupère le username
      const nom_user = user.username;

      //on créé une chaine remplie d'espace pour l'affichage
      let lg_espace = "  ";
      if (nom_user.length >= 7) {
        lg_espace = lg_espace.repeat(nom_user.length - 5);
        this.logger.debug(
          `Le nom ${nom_user} est égal à 7 ou + ; ${nom_user.length}`
        );
      }

      if (d.state === DuelState.PLAYING) {
        //this.logger.debug(`Réponse de has to notify : ${this.hasToNotify(d)}`);

        if (this.hasToNotify(d)) {
          this.logger.debug(`il reste ${this.formatSeconds(d.timeLeft)}`);
          //pour chaque joueur, je ne garde que les LP (MAP) -> on sépare par un | (JOIN)
          formatStr = `=>${lg_espace}${d.players.map((p) => p.lp).join(" | ")}
IL NE RESTE QUE ${this.formatSeconds(d.timeLeft)} ${user} ${user2}!`;
          disc.users.send(
            user,
            `IL NE RESTE QUE ${this.formatSeconds(d.timeLeft)} ${user} !`
          );
          disc.users.send(
            user2,
            `IL NE RESTE QUE ${this.formatSeconds(d.timeLeft)} ${user2} !`
          );
        } else {
          //pour chaque joueur, je ne garde que les LP (MAP) -> on sépare par un | (JOIN)
          formatStr = `=>${lg_espace}${d.players.map((p) => p.lp).join(" | ")}

Temps restant : ${this.formatSeconds(d.timeLeft)}`;
        }
      } else if (d.state === DuelState.FINISHED)
        formatStr = `=>${lg_espace}${d.players.map((p) => p.lp).join(" | ")}
Temps écoulé !`;
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
   * Format a number of seconds to mm "min" ss "s" format
   * @param s
   */
  formatSeconds(s: number): string {
    const hours = Math.floor(s / 3600);
    const minutes = Math.floor((s - hours * 3600) / 60);
    const seconds = Math.floor(s - hours * 3600 - minutes * 60);
    const prefix = (n: number) => (n < 10 ? `0${n}` : n);
    return `${prefix(minutes)}min ${prefix(seconds)}s`;
  }

  /***
   * Return true if the user must be notified
   * @param d
   */
  hasToNotify(d: IDuel): boolean {
    if (!d.notifyAt) return false;

    //On veut notifier l'utilisateur seulement une fois entre deux tick de mise à jour
    //On utilise un intervalle de confiance delta pour gérer les bornes de temps
    const delta = 2 * 1000;
    const deltaInterval = (DuelTimer.INTERVAL - delta) / 1000;

    return d.notifyAt.some(
      (t) => t - deltaInterval < d.timeLeft && t + deltaInterval > d.timeLeft
    );
  }
}

/* OLD
        //alerte 5 min restante
        if (
          d.timeLeft > 5 * 60 - deltaInterval &&
          d.timeLeft < 5 * 60 + deltaInterval
        ) {
          this.logger.debug(`il reste 5 min`);
          //pour chaque joueur, je ne garde que les LP (MAP) -> on sépare par un | (JOIN)
          formatStr = `${lg_espace}${d.players.map((p) => p.lp).join(" | ")}
Temps restant : ${this.formatSeconds(d.timeLeft)}
IL NE RESTE QUE 5 MIN ${user}
                `;
          //alerte 25 min restante
        } else if (
          d.timeLeft > 25 * 60 - deltaInterval &&
          d.timeLeft < 25 * 60 + deltaInterval
        ) {
          this.logger.debug(`il reste 25 min`);
          //pour chaque joueur, je ne garde que les LP (MAP) -> on sépare par un | (JOIN)
          formatStr = `${lg_espace}${d.players.map((p) => p.lp).join(" | ")}
Temps restant : ${this.formatSeconds(d.timeLeft)}
Nous sommes à la moitié du temps ${user}
           `;
                   } else {
          //pour chaque joueur, je ne garde que les LP (MAP) -> on sépare par un | (JOIN)
          formatStr = `${lg_espace}${d.players.map((p) => p.lp).join(" | ")}
Temps restant : ${this.formatSeconds(d.timeLeft)}
           `;
        }

           */
