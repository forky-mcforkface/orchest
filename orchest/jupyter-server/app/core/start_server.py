import argparse
import json
import os
import sys

from jupyterlab.labapp import LabApp


def parse_arguments():
    parser = argparse.ArgumentParser(description='Arguments for JupyterLab Server')

    parser.add_argument('--gateway-url')

    return parser.parse_args()


def format_arguments(args):
    """Replaces underscores with minusses."""
    formatted_args = []
    for arg, value in vars(args).items():
        formatted_args.append(f'--{arg.replace("_", "-")}={value}')

    return formatted_args


def main():
    # Formats the passed command line arguments to start the JupyterLab
    # instance. When passing command line arguments they have to be with
    # minusses "-" instead of the underscores "_" the python argparse
    # library parses them to.
    formatted_args = format_arguments(parse_arguments())

    # Add default options.
    # TODO: don't allow to run as root. But to make that work, the
    #       docker image has to be changed in order to allow another
    #       user. For now, it just works.
    formatted_args.extend([
        '--allow-root',
        '--no-browser',
        '--ip=0.0.0.0',
        '--port=8888',
        '--notebook-dir=/notebooks'
    ])
    sys.argv.extend(formatted_args)

    # Initializes the Lab instance and writes its server info to a json
    # file that can be accessed outside of the subprocess in order to
    # connect to the started server.
    la = LabApp()
    la.initialize()

    abs_path = os.path.dirname(os.path.abspath(__file__))
    fname = os.path.join(abs_path, '../tmp/server_info.json')
    with open(fname, 'w') as f:
        json.dump(la.server_info(), f)

    # This print is mandatory. The message can be changed, but the
    # subprocess is piping this output to stdout to confirm that
    # the JupyterLab has successfully started.
    print('Initialized JupyterLab instance')

    # TODO: if the starting takes too long, then the front-end will
    #       already try to connect to the lab instance. Resulting in an
    #       error. This should obviously be more robust.
    la.start()


if __name__ == '__main__':
    main()
