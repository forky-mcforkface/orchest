(quickstart)=

# Quickstart tutorial

```{eval-rst}
.. meta::
   :description: This page contains the quickstart tutorial for Orchest with steps to quickly get started with Orchest.
```

This quickstart follows an example explaining how to build data science pipelines in Orchest and
touches upon some core principles that will be helpful when you get to building your own pipelines.
The example Pipeline will download the [sklearn California housing dataset], explore the data,
train some classifiers, and in the final step collect the results from those classifiers.

[sklearn california housing dataset]: https://scikit-learn.org/stable/modules/generated/sklearn.datasets.fetch_california_housing.html

```{figure} ../img/quickstart/final-pipeline.png
:align: center
:width: 800
:alt: The resulting Pipeline from this Orchest quickstart

The resulting Pipeline from this quickstart.
```

```{tip}
👉 Building data pipelines in Orchest is easy! Check out our [introductory video](https://vimeo.com/589879082).
```

(impatient)=

## For the impatient

As [Miguel Grinberg](https://blog.miguelgrinberg.com/index) would say: "If you are the instant
gratification type, and the screenshot at the top of this article intrigued you, then head over to
the [Github repository](https://github.com/orchest/quickstart) for the code used in this article.
Then come back to learn how everything works!"

To get started in Orchest you can import the GitHub repository URL
`https://github.com/orchest/quickstart` through the UI:

```{figure} ../img/quickstart/import-project.png
:align: center
:width: 800
:alt: Import existing project in Orchest
```

## Create your first project in Orchest

To start, make sure you have {ref}`installed Orchest <regular-installation>` or go to your [Orchest Cloud](https://cloud.orchest.io/) account.
Next, create a new {ref}`project <projects>` named `quickstart`. After creating the project, you will see that it
does not yet have any {term}`pipelines <(Data science) pipeline>`.

```{figure} ../img/quickstart/project-creation.png
:align: center
:width: 800
:alt: List of projects in Orchest
```

```{note}
All code in this quickstart is written in Python, nevertheless,
Orchest also supports other languages such as R.
```

## Get California housing data

The logical next step is to create the first Pipeline called `California housing` and open the
pipeline editor. This will automatically boot an {term}`interactive session <Interactive session>` so
you can interactively edit the Python script Orchest creates. The rest of the steps will be Jupyter Notebooks!

1. Create a new step by clicking: _+ new step_.
2. Enter a _Title_ and _File path_, respectively `Get housing data` and `get-data.py`.

```{figure} ../img/quickstart/step-properties.png
:align: center
:width: 300
:alt: Step properties of an Orchest Pipeline
```

```{note}
The changes you make to the Pipeline (through the pipeline editor) are saved automatically.
```

Now you can start writing our code through the familiar JupyterLab interface, simply press _edit in
JupyterLab_ (making sure you have the step selected) and paste in the following code:

```{code-block} python
:emphasize-lines: 11, 19
:linenos: true

import orchest
import pandas as pd
from sklearn import datasets

# Explicitly cache the data in the "/data" directory since the
# kernel is running in a Docker container, which are stateless.
# The "/data" directory is a special directory managed by Orchest
# to allow data to be persisted and shared across pipelines and
# even projects.
print("Dowloading California housing data...")
data = datasets.fetch_california_housing(data_home="/data")

# Convert the data into a DataFrame.
df_data = pd.DataFrame(data["data"], columns=data["feature_names"])
df_target = pd.DataFrame(data["target"], columns=["MedHouseVal"])

# Output the housing data so the next steps can retrieve it.
print("Outputting converted housing data...")
orchest.output((df_data, df_target), name="data")
print("Success!")
```

A few lines in the code above are highlighted to emphasize important nuts and bolts to
get a better understanding of building pipelines in Orchest. These nuts and bolts are explained
below:

> Line `11` caches the data in the `/data` directory. This is actually the `userdir/data` directory
> (from the Orchest GitHub repository) that gets mounted in the respective Docker container running your code.
> This allows you to access the data from any pipeline, even from pipelines in different projects.
> Data should be stored in `/data` not only for sharing purposes, but also to make sure that {ref}`jobs <jobs>`
> do not unnecessarily copy the data when creating the snapshot for reproducibility reasons.
>
> Secondly, line `19` showcases the usage of the {ref}`Orchest SDK <orchest sdk>` to
> {ref}`pass data between pipeline steps <data passing>`. Keep in mind that calling
> {meth}`orchest.transfer.output` multiple times will result in the data getting overwritten,
> in other words: only output data once per step!

To run the code, switch back to the pipeline editor, select the step and press _run selected steps_.
After just a few seconds you should see that the step completed successfully. Check the logs
to confirm - they contain the latest STDOUT of the script.

```{figure} ../img/quickstart/step-logs.png
:align: center
:width: 300
:alt: Step logs of an Orchest Pipeline
```

Remember that running the code will output the converted housing data, so in the next step you can
now retrieve and explore that data!

## Data exploration

Now that you have downloaded the data, the next Pipeline Step can explore it. Create another Pipeline
Step with _Title_ `Data exploration` and _File path_ `explore-data.ipynb`, and connect the two
Pipeline Steps.

```{figure} ../img/quickstart/pipeline-two-steps.png
:align: center
:width: 400
:alt: Pipeline with two steps in Orchest
```

You can get the code for this Pipeline Step from the `explore-data.ipynb` [file in the GitHub
repository](https://github.com/orchest/quickstart/blob/main/explore-data.ipynb).

Maybe you already noticed the imports in the previous step:

```python
import orchest
import pandas as pd
from sklearn import datasets
```

These dependencies are satisfied by default, because the {ref}`environments <environments>`
are based on the [Jupyter Docker Stacks](https://jupyter-docker-stacks.readthedocs.io/en/latest/)
which come pre-installed with common data science packages.

```{note}
Adding additional dependencies (even system level dependencies) can be done by using
{ref}`environments <environments>`.
```

## Finalizing the pipeline

To end up with the final Pipeline, please refer to the {ref}`For the impatient <impatient>` section
to import the Pipeline. You can also build the Pipeline from scratch yourself!

```{figure} ../img/quickstart/final-pipeline-completed.png
:align: center
:width: 800
:alt: Successful Pipeline run of the final Pipeline in Orchest

A successful Pipeline run of the final Pipeline.
```

```{note}
The {term}`interactive session <Interactive session>` does not shut down automatically and thus the
resources will keep running when editing another P ipeline, you can shut down the session manually
by clicking on the shut down button. Of course all resources are shut down when you shut down
your self-hosted Orchest by running the command `orchest stop`.
```
