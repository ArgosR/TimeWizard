import "reflect-metadata";
import { Container, decorate, injectable } from "inversify";
import { COMMANDS_TAGS, TYPES } from "./types";
import { DaprClient } from "@dapr/dapr";
import { ILogger } from "./pkg/logger/logger-api";
import { plainTextLogger } from "./pkg/logger/logger-plain-text";
import { ecsLogger } from "./pkg/logger/logger-ecs";
import { Client, GatewayIntentBits } from "discord.js";
import { ICommandMatcher } from "./pkg/command-matcher/command-matcher-api";
import { CommandMatcher } from "./pkg/command-matcher/command-matcher";
import {
  ILeafCommand,
  INodeCommand,
  IRootCommand,
} from "./internal/commands/command";
import { TimeWizard } from "./time-wizard";
import { REST } from "@discordjs/rest";
import { ReactiveExternalStore } from "./internal/state-store/reactive-external-store";
import { IStoreProxy } from "./internal/state-store/state-store.api";
import * as EventEmitter from "events";
import { IDuelManager } from "./pkg/duel-manager/duel-manager.api";
import { DuelManager } from "./pkg/duel-manager/duel-manager";
import { ICoroutine } from "./internal/coroutines/coroutune-api";
import { DuelTimer } from "./internal/coroutines/duel-timer/duel-timer";
import { MainDuel } from "./commands/duel/duels-command";
import { StartDuel } from "./commands/duel/start/start-duel";
import { NodeDuelLifepoints } from "./commands/duel/lifepoints/lifepoints-edit-command";
import { AddLifepoints } from "./commands/duel/lifepoints/add/add-lifepoints";
import { RemoveLifepoints } from "./commands/duel/lifepoints/remove/remove-lifepoints";

export const container = new Container();
decorate(injectable(), EventEmitter);

// TODO :: Properly init all dapr components from env
// TODO:: Make dapr port a env variable
/** Proxies */
const DAPR_HTTP_PORT = process.env.DAPR_HTTP_PORT ?? "3501";
container
  .bind(TYPES.StoreProxy)
  .toConstantValue(new DaprClient("127.0.0.1", DAPR_HTTP_PORT).state);

/**
 * Logger
 * Using ECS format in production to allows for an ELK stack to parse them
 * Using plain text in dev to still have a human-readable format
 */
const logger =
  process.env.NODE_ENV === "production" ? ecsLogger : plainTextLogger;
container.bind<ILogger>(TYPES.Logger).toConstantValue(logger);

/** State stores */
container
  .bind(TYPES.BotStateStore)
  .toConstantValue(
    new ReactiveExternalStore(
      container.get<IStoreProxy>(TYPES.StoreProxy),
      process.env.STATE_STORE_NAME ?? "statestore",
      "bot-state"
    )
  );

/** Discord client */
container.bind(TYPES.DiscordClientProvider).toProvider((context) => {
  let instance: Client = null;
  return () => {
    if (instance === null) {
      return new Promise((res, rej) => {
        const client = new Client({
          intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent,
            GatewayIntentBits.GuildVoiceStates,
          ],
        });
        client.login(process.env.BOT_TOKEN);
        if (client.isReady()) res(client);
        client.on("ready", () => {
          console.log("Up and running");
          instance = client;
          res(client);
        });
        setTimeout(() => {
          if (client.isReady()) res(client);
          else rej();
        }, 20000);
      });
    } else {
      return Promise.resolve(instance);
    }
  };
});

/** Discord REST API */
container
  .bind<REST>(TYPES.DiscordRestApi)
  .toConstantValue(new REST({ version: "10" }));

/** Duel manager */
container
  .bind<IDuelManager>(TYPES.DuelManager)
  .toConstantValue(new DuelManager(container.get(TYPES.BotStateStore)));

/** Commands and matcher
 * Command structure
 *  duel
 *      start
 *      end
 *      pause
 *      resume
 *      lp
 *        add
 *        remove
 *        set
 * */

// Duel
container.bind<IRootCommand>(TYPES.CommandRoot).to(MainDuel);
// Duel -> Start
container
  .bind<ILeafCommand>(TYPES.CommandLeaf)
  .to(StartDuel)
  .whenTargetNamed(COMMANDS_TAGS.SubDuel);

// Duel -> Lp
container
  .bind<INodeCommand>(TYPES.CommandNode)
  .to(NodeDuelLifepoints)
  .whenTargetNamed(COMMANDS_TAGS.SubDuel);

// Duel -> Lp -> add
container
  .bind<ILeafCommand>(TYPES.CommandLeaf)
  .to(AddLifepoints)
  .whenTargetNamed(COMMANDS_TAGS.SubLpDuel);

// Duel -> Lp -> remove
container
  .bind<ILeafCommand>(TYPES.CommandLeaf)
  .to(RemoveLifepoints)
  .whenTargetNamed(COMMANDS_TAGS.SubLpDuel);

container.bind<ICommandMatcher>(TYPES.CommandMatcher).to(CommandMatcher);

container.bind<ICoroutine>(TYPES.Coroutine).to(DuelTimer);
/** Main */
container.bind<TimeWizard>(TYPES.Velvet).to(TimeWizard);
