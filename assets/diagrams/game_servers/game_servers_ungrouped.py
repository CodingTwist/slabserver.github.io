# diagram.py
from diagrams import Cluster, Diagram, Edge
from diagrams.onprem.container import Docker
from diagrams.custom import Custom

from urllib.request import urlretrieve

#Pterodactyl
pterodactyl_url = "https://avatars.githubusercontent.com/u/16179146"
pterodactyl_icon = "pterodactyl.png"
urlretrieve(pterodactyl_url, pterodactyl_icon)

with Diagram(filename="game_servers_ungrouped", show=True, direction="TB"):
    with Cluster("Dedicated Ubuntu Server"):

        pterodactyl = Custom("Pterodactyl", pterodactyl_icon)

        with Cluster("Game Servers"):
            proxy = Docker("Proxy")
            survival = Docker("Survival")
            resource = Docker("Resource")
            creative = Docker("Creative")
            gamenight = Docker("Gamenight")
            snapshot = Docker("Snapshot")
            misc = Docker("Misc. Servers")

            # servers = [misc, snapshot, gamenight, creative, resource, survival, proxy]
            servers = [proxy, survival, resource, creative, snapshot, gamenight, misc]

            pterodactyl >> Edge(color="#004da4") >> servers
           