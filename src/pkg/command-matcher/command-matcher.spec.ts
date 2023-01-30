import "reflect-metadata";
import { CommandMatcher } from "./command-matcher";
import { Substitute } from "@fluffy-spoon/substitute";
import { Client } from "discord.js";
import { CommandNotFoundError } from "./command-matcher-api";
import { ICommand } from "../../internal/commands/command";
import { REST } from "@discordjs/rest";

describe("Command Matcher", () => {
  describe("Running commands", () => {
    const cm = getCommandMatcher();
    it("Existing", async () => {
      await expect(cm.run("test", undefined)).resolves.not.toThrow();
    });
    it("Not existing", async () => {
      await expect(cm.run("NO-OP", undefined)).rejects.toThrowError(
        CommandNotFoundError
      );
    });
  });
  describe("Publishing commands", () => {
    const cm = getCommandMatcher();
    it("Existing", async () => {
      await expect(cm.publishCommands("111")).resolves.not.toThrow();
    });
  });
});

function getCommandMatcher() {
  const fakeCommands: ICommand[] = [
    {
      TRIGGER: "test",
      run: (context) => Promise.resolve(),
      SCHEMA: undefined,
    },
  ];
  return new CommandMatcher(
    fakeCommands,
    () => Promise.resolve(Substitute.for<Client>()),
    Substitute.for<REST>()
  );
}
