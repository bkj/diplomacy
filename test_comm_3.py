import asyncio
from diplomacy.client.connection import connect
from diplomacy_research.players import RuleBasedPlayer
from diplomacy_research.players.rulesets import dumbbot_ruleset
from random import *

POWERS = ['AUSTRIA', 'ENGLAND', 'FRANCE', 'GERMANY', 'ITALY', 'RUSSIA', 'TURKEY']

async def create_game(game_id, hostname='shade-dev.tacc.utexas.edu', port=8432):
    """ Creates a game on the server """
    connection = await connect(hostname, port)
    channel = await connection.authenticate('random_user', 'password')
    await channel.create_game(game_id=game_id, rules={'REAL_TIME', 'NO_DEADLINE', 'POWER_CHOICE'})

async def play(game_id, power_name, hostname='shade-dev.tacc.utexas.edu', port=8432):
    """ Play as the specified power """
    connection = await connect(hostname, port)
    channel = await connection.authenticate("bot_"+power_name,'password')
    bot = RuleBasedPlayer(dumbbot_ruleset)

    # Waiting for the game, then joining it
    while not (await channel.list_games(game_id=game_id)):
        await asyncio.sleep(1.)
    game = await channel.join_game(game_id=game_id, power_name=power_name)

    # Playing game
    while not game.is_game_done:
        current_phase = game.get_current_phase()

        #log data
        if current_phase != "S1901M" and randint(1,100) > 50:
            msg = "LOG CHECK from " + power_name + "in " + current_phase
            await game.send_log_data(log=game.new_log_data(body=msg))
            await asyncio.sleep(1)
        if current_phase != "S1901M" and randint(1,100) > 50:
            msg = "MESSAGE CHECK from " + power_name + "in " + current_phase
            temp = [rec for rec in POWERS if not rec == power_name]
            recipient = temp[randint(0,3)]
            await game.send_game_message(message=game.new_power_message(recipient, msg))
            await asyncio.sleep(1)

        # Submitting orders
        orders = await bot.get_orders(game, power_name)
        print("{}\t{}\t{}".format(current_phase, power_name, orders))
        await game.set_orders(power_name=power_name, orders=orders, wait=False)

        if current_phase == "F1905M":
            for phase in game.log_history:
                logs = game.log_history[phase]
                for t in logs:
                    log = logs[t]
                    print(log.phase + "\t" + str(log.time_sent) + "\t" + log.sender + "\t" + log.message)

        # Waiting for game to be processed
        while current_phase == game.get_current_phase():
            await asyncio.sleep(0.1)

async def launch(game_id):
    """ Creates and plays a network game """
    print("GAME: " + game_id)
    await create_game(game_id)
    await asyncio.gather(*[play(game_id, power_name) for power_name in POWERS])

if __name__ == '__main__':
    asyncio.run(launch(game_id=str(randint(1, 1000))))
