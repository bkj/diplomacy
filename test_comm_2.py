import asyncio
import random
from diplomacy.client.connection import connect
from diplomacy.utils import exceptions
from diplomacy_research.players import RuleBasedPlayer
from diplomacy_research.players.rulesets import dumbbot_ruleset
from random import *
from diplomacy.utils import strings
import time

POWERS = ['AUSTRIA','ENGLAND', 'FRANCE', 'GERMANY', 'ITALY', 'RUSSIA', 'TURKEY']
STATUS = [strings.BUSY, strings.READY, strings.INACTIVE]

async def create_game(game_id, hostname='localhost', port=8432):
    """ Creates a game on the server """
    connection = await connect(hostname, port)
    channel = await connection.authenticate('random_user', 'password')
    await channel.create_game(game_id=game_id, rules={'REAL_TIME', 'NO_DEADLINE', 'POWER_CHOICE'})



def on_game_processed(network_game, notification):
    print("({}/{}): notification received {} for role = {}".format(network_game.get_current_phase(), network_game.power.name, notification.name, notification.game_role))

def on_message_received(network_game, notification):
    msg = notification.message
    sender = msg.sender
    recipient = msg.recipient
    message = msg.message
    print("({}/{}): {} received the following message from {}: \n\t{}".format(network_game.get_current_phase(), notification.game_role, recipient, sender, message))


async def play(game_id, power_name, hostname='localhost', port=8432):
    """ Play as the specified power """
    connection = await connect(hostname, port)
    channel = await connection.authenticate("bot_"+power_name,'password')
    bot = RuleBasedPlayer(dumbbot_ruleset)

    # Waiting for the game, then joining it
    while not (await channel.list_games(game_id=game_id)):
        await asyncio.sleep(1.)

    TYPES = [strings.HUMAN, strings.NO_PRESS_BOT, strings.PRESS_BOT]
    type = TYPES[randint(0,2)]
    print("({}): joining as type = {}".format(power_name, type))
    game = await channel.join_game(game_id=game_id, power_name=power_name, player_type=type)
    game.add_on_game_processed(on_game_processed)
    game.add_on_game_message_received(on_message_received)

    temp = {}
    for p in game.powers.values():
        temp[p.name] = [p.player_type, p.comm_status]

    print(power_name)
    print(temp)

    allPlayersJoined = False
    while game.is_game_active == False & allPlayersJoined == False:

        #all player_type must be not strings.NONE to proceed
        playerTypes = [pow.player_type for pow in game.powers.values()]
        if strings.NONE not in playerTypes:
            allPlayersJoined = True
            print("{}: everyone is ready!".format(power_name))

        await asyncio.sleep(4)
        temp = {}
        for p in game.powers.values():
            temp[p.name] = [p.player_type, p.comm_status]

        print(power_name)
        print(temp)

    # Playing game
    while not game.is_game_done:
        beginNeg = True
        current_phase = game.get_current_phase()

        #simulate a delay for pinging model
        #set flag for communication
        thinking = randint(0,20)

        print("({}/{}) thinking for {}s".format(current_phase, power_name, str(thinking)))
        await asyncio.sleep(thinking)
        await game.set_comm_status(comm_status=strings.READY)
        print("({}/{}) ready to communicate".format(current_phase, power_name))

        #INITIAL STRATEGY DECISION
        #wait until everyone is ready to communicate (simple case: check all 7 are ready
        while not beginNeg:
            status = [pow.comm_status == strings.READY for pow in game.powers.values()]
            if sum(status) == 7:
                beginNeg = True
                print("({}/{}): everyone is ready to communicate".format(current_phase, power_name))
            await asyncio.sleep(4)


        #LOGGING
        if random() > 0.5:
            msg = current_phase + "\t" + "LOG CHECK from " + power_name
            await game.send_log_data(log=game.new_log_data(body=msg))
            await asyncio.sleep(2)

        #DIPLOMACY
        diplomacy = False
        dipTime = 10
        t1 = time.time()
        while diplomacy:
            #SEND MESSAGES
            if random() > 0.5:
                temp = [rec for rec in POWERS if not rec == power_name]
                recipient = temp[randint(0,5)]
                msg = "({}/{}): sending message to {}".format(current_phase, power_name, recipient)
                print(msg)
                await game.send_game_message(message=game.new_power_message(recipient, msg))
                await asyncio.sleep(1)

            t2 = time.time()
            if t2 - t1 > dipTime:
                print("({}/{}): diplomacy phase complete".format(current_phase, power_name))
                diplomacy = False


        # Submitting orders
        orders = await bot.get_orders(game, power_name)
        print("({}/{}): orders {}".format(current_phase, power_name, orders))
        await game.set_orders(power_name=power_name, orders=orders, wait=False)


        # Waiting for game to be processed
        while current_phase == game.get_current_phase():
            await asyncio.sleep(0.1)

    # A local copy of the game can be saved with to_saved_game_format
    # To download a copy of the game with messages from all powers, you need to export the game as an admin
    # by logging in as 'admin' / 'password'
    print(power_name + "----------------------------")
    print(game.log_history)


async def launch(game_id):
    """ Creates and plays a network game """
    game_id = "t16"
    await create_game(game_id, hostname="shade-dev.tacc.utexas.edu")
    #await play(game_id, "ENGLAND", hostname="localhost")
    await asyncio.gather(*[play(game_id, power_name, hostname="shade-dev.tacc.utexas.edu") for power_name in POWERS])

if __name__ == '__main__':
    asyncio.run(launch(game_id=str(randint(1, 1000))))
