async function updateLinks(section) {
    const links = section.querySelectorAll('a');
    for (const link of links) {
      const path = findFileFromLink(link.getAttribute('href'), jsonData)
      if(path) {
        link.dataset.url = path
        link.href = path
        link.addEventListener('click', function(event) {

            event.preventDefault();

            let hash = this.dataset.url
            window.location.hash = hash;
          });
      }
      else if (link.href) {
        const isInternal = new URL(link.href, window.location.origin).origin === window.location.origin;
        if (isInternal && !(await validateAsset(link.href))) {
          link.replaceWith(document.createTextNode("[[" + link.textContent + "]]") );
        }
      }
  };
}

async function validateAsset(url) {
    try {
            const request = new XMLHttpRequest();
            request.open('HEAD', url, true);
            request.send();
            if (request.status >= 200 && request.status < 300) {
                return true;
            } else {
                return false;
            }
    } catch (error) {
            return false;
    }
}


function findFileFromLink(href, jsonData) {
  for (const key in jsonData) {
    if (jsonData[key].filepath === href.replace(/%20/g, " ")) {
      return jsonData[key].filepath;
    }
  }
  return null;
}


function displayBacklinks(file) {
  const linkedFiles = file.backlinks || [];
  if (linkedFiles.length > 0) {
    const backlinkList = document.createElement('ul');
    for (const key in linkedFiles) {
    const linkedFile = linkedFiles[key];

    const backlinkItem = document.createElement('li');
    const backlinkLink = document.createElement('a');

    backlinkLink.textContent = linkedFile.title;
    backlinkLink.href = linkedFile.filepath;
    backlinkLink.dataset.id= linkedFile.id;
    backlinkLink.dataset.url= linkedFile.filepath;

    backlinkItem.appendChild(backlinkLink);
    backlinkList.appendChild(backlinkItem);

    }

    backlinkSection.appendChild(backlinkList);
  } else {
    backlinkSection.textContent = 'No backlinks found.';
  }
}


function parseLinks(text) {
  return text.replace(/!?\[\[([^\]]+)\]\]/g, (match, content) => {
    const [link, alias] = content.split('|').map(part => part.trim());
    return convertLinkToMarkdown(link, alias);
  });
}


function convertLinkToMarkdown(link, alias = link, isEmbedded) {
  const formattedLink = ensureFileExtension(link);
  if (isEmbedded) {
      return `![${alias}](${formattedLink.replace(/ /g, "%20")})`;
    }
  else {
    return `[${alias}](${formattedLink.replace(/ /g, "%20")})`;
  }
}


function ensureFileExtension(link) {
  // Add .md file extension if none
  const fileExtensionRegex = /\.[a-zA-Z0-9]+$/;
  return fileExtensionRegex.test(link) ? link : `${link}.md`;
}


function displayLinks(file) {
  const linkedFiles = file.links || [];
  if (linkedFiles.length > 0) {
    const linkList = document.createElement('ul');

    linkedFiles.forEach(linkedFile => {
      console.log(linkedFile);
      const linkItem = document.createElement('li');
      const linkAnchor = document.createElement('a');

      linkAnchor.textContent = linkedFile.title;
      linkAnchor.href = linkedFile.url;
      linkAnchor.dataset.id= linkedFile.id;
      linkAnchor.dataset.url = linkedFile.filepath;

      linkItem.appendChild(linkAnchor);
      linkList.appendChild(linkItem);
    });

    linkSection.appendChild(linkList);
  } else {
    linkSection.textContent = "No links found.";
  }
}


function listMarkdownHeadings(content) {
  const headings = content.querySelectorAll('h1, h2, h3, h4, h5, h6');
  const headingsList = document.createElement('ul');
  const listStack = [headingsList]; // Stack to manage nested lists
  let currentDepth = 1; // Tracks the depth of the last heading processed

  if (headings.length > 0) {
    headings.forEach((heading) => {
      const depth = parseInt(heading.tagName.substring(1)); // Get heading depth
      const text = heading.textContent.trim();

      const listItem = document.createElement('li');
      const headingLink = document.createElement('a');
      headingLink.textContent = text;
      headingLink.href = '#' + text.toLowerCase().replace(/\s+/g, '-');
      headingLink.addEventListener('click', function (event) {
        event.preventDefault();
        heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });



      listItem.classList.add(`heading-level-${depth}`);
      listItem.appendChild(headingLink);

      if (depth > currentDepth) {
         const nestedList = document.createElement('ul');
         const parentListItem = listStack[listStack.length - 1].lastElementChild;
        if (parentListItem) {
          parentListItem.appendChild(nestedList);
          listStack.push(nestedList);
        }
          } else if (depth < currentDepth) {
            // Pop the stack until the correct level is reached
            while (depth < currentDepth && listStack.length > 1) {
              listStack.pop();
              currentDepth--;
            }
          }

      listStack[listStack.length - 1].appendChild(listItem);

      currentDepth = depth;
    });

    headingsSection.appendChild(headingsList);
  } else {
    // headingsSection.textContent = 'No headings found';
    // headingsSection.style.display = 'none';
  }
}


async function updateEmbeddedLinks(section) {
  const links = section.querySelectorAll('img');
  for (const link of links) {
    const src = link.getAttribute('src');
    if(!link.alt) {
      link.alt = src
    };
    const fileType = src.split('.').pop().toLowerCase();
    if(['mp3', 'wav', 'ogg', 'm4a', 'flac'].includes(fileType)) {

      const audio =  document.createElement('audio');
      audio.controls = true;
      audio.innerHTML = `
                <source src="${src}" type="audio/${fileType}">
                Your browser does not support the audio element.
                `;
      link.parentNode.replaceChild(audio, link)
    }
    else if (['mp4', 'webm', 'ogg'].includes(fileType)) {

      const video =  document.createElement('video');
      video.controls = true;
      video.innerHTML = `
                <source src="${src}" type="video/${fileType}">
                Your browser does not support the video element.
                `;
      link.parentNode.replaceChild(video, link)
    }
    else if (config.includedFiletypes.includes(fileType)) {
      const item = findFileInJSON(src, jsonData);
      if (item) {

        const mdBlock = document.createElement('md-block');
        addContent(item, mdBlock);
        link.parentNode.replaceChild(mdBlock, link);
      }
      else {
          const isInternal = new URL(src, window.location.origin).origin === window.location.origin;
        if (isInternal && !(await validateAsset(src))) {
          link.replaceWith(document.createTextNode("[[" + link.textContent + "]]") );
        }
    }
  };
}
