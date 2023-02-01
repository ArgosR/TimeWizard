import { inject, injectable } from "inversify";
import { ILeafCommand } from "../../../../internal/commands/command";
import { CommandInteraction, SlashCommandSubcommandBuilder } from "discord.js";
import { IDuelManager } from "../../../../pkg/duel-manager/duel-manager.api";
import { ILogger } from "../../../../pkg/logger/logger-api";
import { TYPES } from "../../../../types";

@injectable()
export class RemoveLifepoints implements ILeafCommand {
  readonly TRIGGER = "remove";

  buildSchema(): SlashCommandSubcommandBuilder {
    // On récupère le joueur a qui enlever les LP et le montant voulu
    return new SlashCommandSubcommandBuilder()
      .setName(this.TRIGGER)
      .setDescription("Enlève des LP")
      .addUserOption((p) =>
        p
          .setName("joueur")
          .setDescription("Joueur à qui on ajoute des LP")
          .setRequired(true)
      )
      .addNumberOption((value) =>
        value.setName("value").setDescription("Valeur a enlever")
      );
  }

  constructor(
    @inject(TYPES.Logger) private logger: ILogger,
    /** Create and update duels */
    @inject(TYPES.DuelManager) private duelMgr: IDuelManager
  ) {}

  async run(context: CommandInteraction): Promise<void> {
    // TODO :: réussir à récupérer les LP actuels et les mettre à jour
    await context.deferReply();

    //joueur concerné
    const player = await context.options.getUser("joueur");
    const playerId = player.id;
    //valeur
    const valeur_true = (await context.options.get("value")).value;
    //on récupère le duel avec ce joueur
    const liste_duel = await this.duelMgr.getFor(playerId);

    //on vérifie que la liste n'est pas vide
    if (liste_duel.length != 0) {
      const duel_enc = liste_duel[0];

      //on récupère la valeur des LP du joueur actuel
      const Joueur_actuel = duel_enc.players.find((p) => p.id == playerId);

      // on modifie les LP du joueur
      Joueur_actuel.lp -= Number(valeur_true);

      // On met à jour le duel
      await this.duelMgr.save(duel_enc);
      this.logger.debug(
        `${player.username} a perdu ${valeur_true} LP. Il possède ${Joueur_actuel.lp}`
      );
      await context.deleteReply();
    } else {
      await context.editReply(`Il n'y a pas de duel en cours pour ce joueur`);
      return;
    }

    //on met à jour l'affichage ? -> sera mis à jour à la prochaine itération de temps
  }
}
