# diagram.py
from diagrams import Cluster, Diagram, Edge
from diagrams.onprem.container import Docker
from diagrams.custom import Custom

from urllib.request import urlretrieve

#Backblaze
# backblaze_url = "https://cdn.freelogovectors.net/wp-content/uploads/2021/11/backblaze-logo-freelogovectors.net_-400x109.png"
# backblaze_icon = "backblaze.png"
# urlretrieve(backblaze_url, backblaze_icon)

#Restic
restic_url = "backblaze.png"
restic_icon = "restic.png"
urlretrieve(restic_url, restic_icon)

with Diagram(filename="restic_backblaze", show=True, direction="TB"):

    backblaze = Custom("Backblaze B2 Storage", "backblaze.png")

    with Cluster("Dedicated Ubuntu Server"):

        with Cluster("Game Servers"):
            proxy = Docker("Proxy")
            survival = Docker("Survival")
            resource = Docker("Resource")
            creative = Docker("Creative")
            snapshot = Docker("Snapshot")
            gamenight = Docker("Gamenight")
            misc = Docker("Misc. Servers")

        restic = Custom("Restic", restic_icon)

        servers = [misc, snapshot, gamenight, creative, resource, survival, proxy]

        servers << Edge(color="#a81c2b") >> restic
        restic << Edge(color="#a81c2b") >> backblaze
           