export const TYPES = {
  // Proxies
  BindingProxy: Symbol.for("BindingProxy"),
  PubSubClientProxy: Symbol.for("PubSubClientProxy"),
  PubSubServerProxy: Symbol.for("PubSubServerProxy"),
  ServiceInvocationProxy: Symbol.for("ServiceInvocationProxy"),
  StoreProxy: Symbol.for("StoreProxy"),
  // Basic component, building block for exposed services
  EventBroker: Symbol.for("EventBroker"),
  Queue: Symbol.for("Queue"),
  BotStateStore: Symbol.for("BotStateStore"),
  // Exposed services
  Logger: Symbol.for("Logger"),
  EventRelay: Symbol.for("EventRelay"),
  DiscordClientProvider: Symbol.for("DiscordClientProvider"),
  DiscordRestApi: Symbol.for("DiscordRestApi"),
  RpgDatabase: Symbol.for("RpgDatabase"),
  InteractionHelpers: Symbol.for("InteractionHelpers"),
  DuelManager: Symbol.for("DuelManager"),
  // Commands, using exposed services
  CommandRoot: Symbol.for("CommandRoot"),
  CommandNode: Symbol.for("CommandNode"),
  CommandLeaf: Symbol.for("CommandLeaf"),
  CommandMatcher: Symbol.for("CommandMatcher"),
  // Coroutine
  Coroutine: Symbol.for("Coroutine"),
  // Main
  Velvet: Symbol.for("Velvet"),
};

export const COMMANDS_TAGS = {
  /** All commands under the duel scope */
  SubDuel: Symbol.for("SubCampaign"),
  /** All commands under the duel edit lifepoint scope */
  SubLpDuel: Symbol.for("SubEditCampaign"),
};
