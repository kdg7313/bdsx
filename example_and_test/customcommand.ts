
// Custom Command
import { DimensionId } from "bdsx/bds/actor";
import { RelativeFloat, Vec3 } from "bdsx/bds/blockpos";
import { ActorWildcardCommandSelector, Command, CommandPermissionLevel, CommandPosition, CommandRawText } from "bdsx/bds/command";
import { JsonValue } from "bdsx/bds/connreq";
import { command } from "bdsx/command";
import { events } from "bdsx/event";
import { fsutil } from "bdsx/fsutil";
import { bedrockServer } from "bdsx/launcher";
import { bool_t, CxxString, int32_t } from "bdsx/nativetype";
import { shellPrepareData } from "bdsx/shellprepare/data";
import * as path from 'path';
import * as fs from 'fs';
import { serverInstance } from "bdsx/bds/server";

command.find('say').signature.permissionLevel = CommandPermissionLevel.Admin; // change the say permission

// raw text
command.register('aaa', 'bdsx command example').overload((param, origin, output)=>{
    output.success(
        `raw text example> origin=${origin.getName()}\n`+
        `text: ${param.rawtext.text}`);
}, { rawtext:CommandRawText });

// optional
command.register('bbb', 'optional param example').overload((param, origin, output)=>{
    let out =
        `optional param example> origin=${origin.getName()}\n`+
        `first: ${param.first}`;
    if (param.second !== undefined) out += `\nsecond: ${param.second}`;
    output.success(out);
}, {
    first: int32_t,
    second: [CxxString, true],
});

// empty parameters
command.register('ccc', 'empty params example').overload((param, origin, output)=>{
    output.success(
        `empty params example> origin=${origin.getName()}\n`);
}, {});

// relative float, /ccc ~~~
command.register('ddd', 'relative float example').overload((param, origin, output)=>{
    output.success(
        `relative float example> origin=${origin.getName()}\n`+
        `${param.x.value} ${param.x.is_relative}\n`+
        `${param.y.value} ${param.y.is_relative}\n`+
        `${param.z.value} ${param.z.is_relative}\n`);
}, {
    x: RelativeFloat,
    y: RelativeFloat,
    z: RelativeFloat,
});

// entity
command.register('eee', 'entity example').overload((param, origin, output)=>{
    let out = `entity example> origin=${origin.getName()}`;
    for (const actor of param.target.newResults(origin)) {
        out += '\n'+actor.getName();
    }
    output.success(out);
}, {
    //You can set as player-only with PlayerWildcardCommandSelector
    target: ActorWildcardCommandSelector,
});

// boolean
command.register('fff', 'boolean example').overload((param, origin, output)=>{
    output.success(
        `boolean example> origin=${origin.getName()}\n`+
        `value: ${param.b}`);
}, {
    b: bool_t,
});

// enum
// serverInstance.minecraft.getLevel().setCommandsEnabled(true); // (?) it shows the enum list, but it will turn on allow-cheats.
command.register('ggg', 'enum example').overload((param, origin, output)=>{
    output.success(
        `enum example> origin=${origin.getName()}\n`+
        `enum1: ${param.enum1}\n`+
        `enum2: ${param.enum2}`);
}, {
    enum1: command.enum('EnumType', 'enum1', 'Enum2', 'ENUM3'), // string enum
    enum2: command.enum('DimensionId', DimensionId), // TS enum
});

// json
command.register('hhh', 'json example').overload((param, origin, output)=>{
    output.success(
        `json example> origin=${origin.getName()}\n`+
        `value: ${JSON.stringify(param.json.value())}`);
}, {
    json: JsonValue,
});

// CommandPosition, more useful than three of `RelativeFloat`
command.register('iii', 'position example').overload((param, origin, output)=>{
    // without offset :
    const pos = param.position.getPosition(origin).toJSON();

    // with offset :
    // the offset is used for relative position
    const blockPos = param.position.getBlockPosition(origin, Vec3.create(0, 4, 0)).toJSON();

    output.success(
        `position example> origin=${origin.getName()}\n` +
        `Pos: §a${pos.x.toFixed(2)}§f, §a${pos.y.toFixed(2)}§f, §a${pos.z.toFixed(2)}§f\n`+
        `BlockPos: §a${blockPos.x}§f, §a${blockPos.y}§f, §a${blockPos.z}`);
}, {
    position: CommandPosition,
});

// block
command.register('jjj', 'block example').overload((param, origin, output)=>{
    output.success(
        `block example> origin=${origin.getName()}\n`+
        `block name: ${param.block.getName()}`);
}, {
    block: Command.Block,
});

// disable examples
command.register('disable_example', 'disable examples').overload((param, origin, output)=>{
    const indexPath = path.join(fsutil.projectPath, 'index.ts');
    if (fs.statSync(indexPath).size >= 150) {
        output.error('Failed to disable, index.ts is modified.');
    } else {
        const content = '\r\n// Please start your own codes from here!';
        fs.writeFileSync(indexPath, content);
        fs.writeFileSync(path.join(fsutil.projectPath, 'index.js'), content);

        const data = shellPrepareData.load();
        data.relaunch = '1';
        shellPrepareData.save(data);
        bedrockServer.stop();
    }
}, {});

// hook direct
events.command.on((cmd, origin, ctx)=>{
    switch (cmd) {
    case '/whoami':
        if (ctx.origin.isServerCommandOrigin()) {
            console.log('You are the server console');
        } else if (ctx.origin.isScriptCommandOrigin()) {
            console.log('You are the script engine');
        } else {
            console.log('You are '+origin);
		}
        break;
    default: return; // process the default command
	}
    return 0; // suppress the command, It will mute 'Unknown command' message.
});

