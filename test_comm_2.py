import asyncio
import random
from diplomacy.client.connection import connect
from diplomacy.utils import exceptions
from diplomacy_research.players import RuleBasedPlayer
from diplomacy_research.players.rulesets import dumbbot_ruleset
from random import *
from diplomacy.utils import strings

POWERS = ['AUSTRIA', 'ENGLAND', 'FRANCE', 'GERMANY', 'ITALY', 'RUSSIA', 'TURKEY']
STATUS = [strings.BUSY, strings.READY, strings.INACTIVE]
TYPES = [strings.HUMAN, strings.NO_PRESS_BOT, strings.PRESS_BOT]

def test_callback(network_game, notification):
    print("CALLBACK FIRED")

async def create_game(game_id, hostname='localhost', port=8432):
    """ Creates a game on the server """
    connection = await connect(hostname, port)
    channel = await connection.authenticate('random_user', 'password')
    await channel.create_game(game_id=game_id, rules={'REAL_TIME', 'NO_DEADLINE', 'POWER_CHOICE'})

async def play(game_id, power_name, hostname='localhost', port=8432):
    """ Play as the specified power """
    connection = await connect(hostname, port)
    channel = await connection.authenticate("bot_"+power_name,'password')
    bot = RuleBasedPlayer(dumbbot_ruleset)

    # Waiting for the game, then joining it
    while not (await channel.list_games(game_id=game_id)):
        await asyncio.sleep(1.)

    type = TYPES[randint(0,3)]
    print(power_name + " type = " + type)
    game = await channel.join_game(game_id=game_id, power_name=power_name, player_type=type)
    game.add_on_game_processed(test_callback)

    submit_log = False
    submit_message = False

    while not game.is_game_active:
        await asyncio.sleep(1)

    # Playing game
    while not game.is_game_done:
        current_phase = game.get_current_phase()

        statuses = {}
        for power in game.powers.values():
            statuses[power.name] = power.comm_status
        print("{}\t{}\t{}".format(current_phase, power_name, statuses))

        #log data
        if randint(1,100) > 50:
            msg = current_phase + "\t" + "LOG CHECK from " + power_name
            await game.send_log_data(log=game.new_log_data(body=msg))
            await asyncio.sleep(2)
        if randint(1,100) > 50:
            msg = current_phase + "\t" + "MESSAGE CHECK from " + power_name
            temp = [rec for rec in POWERS if not rec == power_name]
            recipient = temp[randint(0,3)]
            await game.send_game_message(message=game.new_power_message(recipient, msg))
            await asyncio.sleep(2)

        comm_status = STATUS[randint(0,2)]
        await game.set_comm_status(comm_status=comm_status)
        await asyncio.sleep(1)
        print("{}\t{}\t{}".format(current_phase, power_name, comm_status))



        # Submitting orders
        orders = await bot.get_orders(game, power_name)
        print("{}\t{}\t{}".format(current_phase, power_name, orders))
        await game.set_orders(power_name=power_name, orders=orders, wait=False)

        p = game.get_power(power_name)
        stat = p.comm_status
        statuses = {}
        for power in game.powers.values():
            statuses[power.name] = power.comm_status
        print("{}\t{}\t{}".format(current_phase, power_name, statuses))


        # Waiting for game to be processed
        while current_phase == game.get_current_phase():
            await asyncio.sleep(0.1)

        if current_phase == "F1903M":
            print("HEY")




    # A local copy of the game can be saved with to_saved_game_format
    # To download a copy of the game with messages from all powers, you need to export the game as an admin
    # by logging in as 'admin' / 'password'
    print(power_name + "----------------------------")
    print(game.log_history)


async def launch(game_id):
    """ Creates and plays a network game """
    #game_id = "test1"
    await create_game(game_id)
    await asyncio.gather(*[play(game_id, power_name) for power_name in POWERS])

if __name__ == '__main__':
    asyncio.run(launch(game_id=str(randint(1, 1000))))
