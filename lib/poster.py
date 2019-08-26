
"""Handle posts on file system."""

import os
from datetime import datetime as dt
import shutil
import traceback

from lib.tools import (
    buildDateURL,
    buildDatesFromFolders,
    buildRawTimeStr,
    buildURL,
    deleteRecursiveEmptyDirs,
    generateID,
    getDisplayMode,
    getID,
    getTime,
    getTitle,
    getUser,
    sanitize_filename,
)


def savePostTopLevel(
        title, content, display_mode, datetime, id, directory,
        remote_user=None):
    """Add and format options of post and delegate save to savePost function."""
    if datetime is not None:
        directory = os.path.join(directory, buildDateURL(datetime))

    if datetime is None:
        datetime = dt.today()

    if id is None:
        id = generateID()
    if not savePost(
            title, content, display_mode, datetime, id, directory, remote_user):
        return buildURL(datetime, id)
    else:
        return True


def savePost(title, content, display_mode, datetime, id, directory,
             remote_user=None, receiver_username=None):
    """Save post to file system."""
    try:
        directory = os.path.join(directory, buildDateURL(datetime))
        try:
            os.makedirs(directory)
        except:
            pass
        remote_user = str(remote_user)

        title = sanitize_filename(title)

        filename = os.path.join(
            directory, id + '-' + title + '-' + buildRawTimeStr(datetime) + '-' +
            str(display_mode) + '-' + remote_user)
        posts = os.listdir(directory)
        for post in posts:
            post = post.decode('utf-8')
            if id in post and title not in post and not os.path.isdir(
                    os.path.join(directory, post.encode('utf-8'))):
                os.rename(os.path.join(directory, post.encode('utf-8')), filename.encode('utf-8'))
            if id in post and title in post and getDisplayMode(post.encode('utf-8')) != display_mode and not os.path.isdir(os.path.join(directory, post.encode('utf-8'))):
                os.rename(os.path.join(directory, post.encode('utf-8')), filename.encode('utf-8'))

        file = open(filename.encode('utf-8'), 'w')
        file.write(content)
        file.close()
        return False
    except Exception as e:
        traceback.print_exc()
        print('savePost ' + str(e))
        return True


def getPost(directory, datetime, id):
    """"Retrieve post from file system."""
    directory = os.path.join(directory, buildDateURL(datetime))
    try:
        posts = os.listdir(directory)
    except Exception as e:
        print('getPost file does not exists ' + str(e))
        return None
    title = None
    display_mode = None
    filename = None

    for post in posts:
        post = post.decode('utf-8')
        if id in post and buildRawTimeStr(datetime) in post:
            title = getTitle(post)
            display_mode = getDisplayMode(post)
            filename = post
            user = getUser(post)

    if title is None or display_mode is None:
        return None

    if user == 'None':
        user = None

    try:
        filename = filename.encode('utf-8')
        file = open(os.path.join(directory, filename), 'r')
        content = file.read().decode('utf-8')
        file.close()
        return {
            'content': content,
            'title': title,
            'link': buildURL(datetime, id),
            'display_mode': display_mode,
            'user': user
        }
    except Exception as e:
        traceback.print_exc()
        print('getPost write ' + str(e))
        return True


def getAllPosts(directory):
    """Create list of all posts with additional information about each post."""
    try:
        final_posts = []
        dates = buildDatesFromFolders(directory)
        if len(dates) == 0:
            return []

        dates.sort(key=lambda x: dt.strptime(x, '%Y/%m/%d'), reverse=True)
        for date in dates:
            posts = [
                d for d in os.listdir(os.path.join(directory, date))
                if not os.path.isdir(os.path.join(directory, date, d))]
            posts.sort(key=lambda x: dt.strptime(
                getTime(x), '%H%M%S'), reverse=True)

            if len(posts) == 0:
                continue

            final_posts.append({
                'title': None,
                'link': None,
                'time': date
            })

            for post in posts:
                time = getTime(post)
                datetime = dt.strptime(date + time, '%Y/%m/%d%H%M%S')
                id = getID(post)
                title = getTitle(post)
                try:
                    title = title.decode('utf-8')
                except:
                    pass
                final_posts.append({
                    'title': title,
                    'link': buildURL(datetime, id),
                    'time': datetime.strftime('%H:%M:%S'),
                    'user': getUser(post)
                })

        return final_posts
    except Exception as e:
        print('getAllPosts listdir ' + str(e))
        return True


def delete(directory, datetime_string, id):
    """Delete a post on file system."""
    try:
        cat_dir = os.path.join(directory, datetime_string)
        try:
            files = os.listdir(cat_dir)
        except Exception as e:
            print('delete' + str(e))
            return None

        for file in files:
            file = file.decode('utf-8')
            if id in file and not os.path.isdir(os.path.join(cat_dir, file.encode('utf-8'))):
                os.remove(os.path.join(directory, datetime_string, file.encode('utf-8')))
                deleteRecursiveEmptyDirs(cat_dir)
                if os.path.isdir(os.path.join(cat_dir, id)):
                    shutil.rmtree(os.path.join(cat_dir, id))
                return "Post deleted"

        return "Post not found"
    except Exception as e:
        traceback.print_exc()
        print('delete ' + str(e))
        return True


def deleteFile(file):
    """Delete an uploaded file from file system."""
    try:
        os.remove(file)
        try:
            if len(os.listdir(file.rpartition('/')[0])) == 0:
                shutil.rmtree(file.rpartition('/')[0])
        except:
            pass
    except:
        return True
