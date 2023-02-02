import { inject, injectable } from "inversify";
import { ILeafCommand } from "../../../internal/commands/command";
import { TYPES } from "../../../types";
import { ILogger } from "../../../pkg/logger/logger-api";
import { IDuelManager } from "../../../pkg/duel-manager/duel-manager.api";
import { CommandInteraction, SlashCommandSubcommandBuilder } from "discord.js";

@injectable()
export class EndDuel implements ILeafCommand {
  readonly TRIGGER = "end";

  constructor(
    @inject(TYPES.Logger) private logger: ILogger,
    /** Create and update duels */
    @inject(TYPES.DuelManager) private duelMgr: IDuelManager
  ) {}

  buildSchema(): SlashCommandSubcommandBuilder {
    return new SlashCommandSubcommandBuilder()
      .setName(this.TRIGGER)
      .setDescription("Arrête le duel")
      .addUserOption((p) =>
        p.setName("joueur").setDescription("joueur participant au duel")
      );
  }

  async run(context: CommandInteraction): Promise<void> {
    await context.deferReply();
    //si l'option a été remplie, alors on récupère le joueur en paramètre
    const player = await context.options.getUser("joueur");
    //this.logger.debug(`ID PLAYER ${player?.id} ${player?.username} `);
    const playerExecId = context.user.id;
    let playerId = player?.id;

    if (player == null) {
      //this.logger.debug(`ID PLAYER ${playerId}`);
      //sinon, on récupère le joueur qui a lancé la commande
      if (playerId == undefined) {
        playerId = playerExecId;
        // this.logger.debug(`on est dans la boucle if player est undefined.`);
      }
      //this.logger.debug(`ID du joueur ${playerExecId} `);
    }

    //on récupère les duels avec ce joueur
    const liste_duel = await this.duelMgr.getFor(playerId);

    if (liste_duel.length != 0) {
      const duel_enc = liste_duel[0];
      //on attribue la valeur FINISHED (2) à l'état du duel
      duel_enc.state = 2;
      // On met à jour le duel
      await this.duelMgr.save(duel_enc);
      //on notifie
      if (player == null) {
        await context.editReply(`Ton duel est terminé.`);
        this.logger.debug(`Le duel du lanceur s'est terminé.`);
      } else {
        await context.editReply(`Le duel de ${player} est terminé.`);
        this.logger.debug(`Le duel de ${player} s'est terminé.`);
      }
    } else {
      if (player == null) {
        await context.editReply(`Tu n'as pas de duel en cours.`);
      } else {
        await context.editReply(`${player} n'as pas de duel en cours.`);
      }

      return;
    }
  }
}
