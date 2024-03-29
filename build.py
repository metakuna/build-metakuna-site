import json
import logging
import os
import re
import shutil
import sys
from datetime import datetime
from distutils.dir_util import copy_tree

from django.template import loader
from markdown import Markdown

logger = logging.getLogger(__name__)

ROOT = "metakuna.me/"
TEMPLATES = "templates/"
# these templates will just be inserted straight into master
JUST_WRAP = "templates/just-wrap/"
STATIC = "static/"
POSTS = "posts/"
TEMP = "temp/"

titles = {}

md = Markdown(extensions=["markdown_markup_emoji.markup_emoji"])

def build_post(dir_ext):
    # make the static page
    try:
        dir_name = f"{POSTS}{dir_ext}"
        copy_tree(dir_name, f"{TEMP}{dir_name}")
        with open(f"{dir_name}/post.md", "r") as f:
            html = md.convert(f.read())
        filename = f"{TEMP}{dir_name}/post.html"
        os.makedirs(os.path.dirname(filename), exist_ok=True)
        with open(filename, "w") as f:
            print(html, file=f)

        with open(f"{dir_name}/meta.json", "r") as metadata_file:
            metadata = json.load(metadata_file)
            metadata["link"] = f"{dir_name}/post"
            metadata["image"] = f"{dir_name}/{metadata['image']}"
            titles[filename] = metadata["title"]
            return metadata
    except Exception as e:
        logger.error(e)
    return None

def _delete_dir_contents(dirname):
    for filename in os.listdir(dirname):
        file_path = os.path.join(dirname, filename)
        try:
            if os.path.isfile(file_path) or os.path.islink(file_path):
                os.unlink(file_path)
            elif os.path.isdir(file_path):
                shutil.rmtree(file_path)
        except Exception as e:
            print('Failed to delete %s. Reason: %s' % (file_path, e))


if __name__ == "__main__":
    if len(sys.argv) > 1:
        ROOT = "dummy.metakuna.me/"

    # delete contents of exiting root dir
    _delete_dir_contents(ROOT)

    # copy all static files directly into the dir
    copy_tree(STATIC, ROOT)
    copy_tree(JUST_WRAP, TEMP)

    posts_meta = []
    for post_dir in os.listdir(POSTS):
        meta = build_post(post_dir) if os.path.isdir(f"{POSTS}{post_dir}") else None
        if meta:
            posts_meta.append(meta)
    posts_meta.sort(
        key=lambda p: datetime.strptime(p["published"], "%Y-%m-%d"), reverse=True
    )

    # build the blog page
    blog_t = loader.get_template("blog_list.html")
    data = {"posts": posts_meta}
    with open(f"{TEMP}index.html", "w") as f:
        print(blog_t.render(data), file=f)

    # copy all the files over from temp, wrapping html files in the master template
    html_regex = re.compile(".*\.html$")
    t = loader.get_template("master.html")
    for (path, _, files) in os.walk(TEMP):
        # x is like (full_dir_path, [subdirs (relative)], [files])
        l = len(TEMP)
        temp_path = path[l:]  # cut off the start of the path for copying purposes
        for f_name in files:
            f_path = f"{temp_path}{'/' if temp_path else ''}{f_name}"
            out_filename = f"{ROOT}{f_path}"
            os.makedirs(os.path.dirname(out_filename), exist_ok=True)
            if html_regex.match(f_name):
                # render it into the master template
                data = {"main": f_path}
                data["title"] = (
                    titles[TEMP + f_path] if (TEMP + f_path) in titles else "metakuna"
                )
                with open(out_filename, "w") as f:
                    print(t.render(data), file=f)
            else:
                # just copy the file
                shutil.copyfile(f"{TEMP}{f_path}", out_filename)

    shutil.rmtree(TEMP)
