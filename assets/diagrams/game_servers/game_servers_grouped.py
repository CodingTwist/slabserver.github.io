# diagram.py
from urllib.request import urlretrieve

from diagrams import Cluster, Diagram, Edge
from diagrams.onprem.container import Docker
from diagrams.custom import Custom
from diagrams.generic.blank import Blank

#Pterodactyl
pterodactyl_url = "https://avatars.githubusercontent.com/u/16179146"
pterodactyl_icon = "pterodactyl.png"
urlretrieve(pterodactyl_url, pterodactyl_icon)

with Diagram(filename="game_servers_grouped", show=True, direction="TB"):

    with Cluster("Dedicated Ubuntu Server"):

        with Cluster("Game Servers - Bungee Network 1"):
            proxy = Docker("Proxy")
            survival = Docker("Survival")
            resource = Docker("Resource")
            proxy >> Edge(color="darkgreen") << survival
            proxy >> Edge(color="darkgreen") << resource

        with Cluster("Game Servers - Other servers"):
            creative = Docker("Creative")
            snapshot = Docker("Snapshot")
            gamenight = Docker("Gamenight")
            misc = Docker("Misc. Servers")
            nonbungee = [creative, snapshot, gamenight, misc]

        # with Cluster("Game Servers - Bungee Network 2"):
        #     proxy2 = Docker("Proxy 2")
        #     creative = Docker("Creative")
        #     modded = Docker("Modded")
        #     minigames = Docker("Minigames")
        #     proxy2 >> Edge(color="darkgreen") >> [creative, modded, minigames]



