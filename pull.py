from Bio.Entrez import efetch
import xml.etree.ElementTree as ET
import pandas
from BeautifulSoup import BeautifulSoup
import csv
import pandas as pd

def fetch_abstract():

    colnames = ['pmids']
    data = pandas.read_csv("pmids.csv", names=colnames)

    pmids = list(data.pmids)

    full = []

    for i in pmids:

            handle = efetch(db='pubmed', id=i, retmode='xml')

            xml_data = handle.read()

            soup = BeautifulSoup(xml_data)

            a_recs = []

            for tag in soup.findAll("pubmedarticle"): 

                title = tag.articletitle.text
                journal = tag.findAll("journal")

                try:
                    for info in journal:
                        year = info.find("year").text
                except:
                    for info in journal:
                        year = info.find("year")

                for a_tag in tag.findAll("author"):
                    a_rec = {}
 
                    a_rec['year'] = year

                    a_rec['title'] = title

                    a_rec['pmid'] = int(tag.pmid.text)
                    
                    try:
                        a_rec['lastname'] = str(a_tag.lastname.text)
                    except:
                        a_rec['lastname'] = str(a_tag.lastname)
                    
                    try:
                        a_rec['forename'] = str(a_tag.forename.text)
                    except:
                        a_rec['forename'] = str(a_tag.forename)
                    
                    try: 
                        a_rec['initials'] = str(a_tag.initials.text)
                    except:
                        a_rec['initials'] = str(a_tag.initials)

                    try:
                        a_rec['affiliation'] = str(a_tag.affiliation.text)
                    except:
                        a_rec['affiliation'] = str(a_tag.affiliation)
                    
                    a_recs.append(a_rec)
            

            #full.append(a_recs)
            full.append(a_recs)

            def convert(input):
                if isinstance(input, dict):
                    return {convert(key): convert(value) for key, value in input.iteritems()}
                elif isinstance(input, list):
                    return [convert(element) for element in input]
                elif isinstance(input, unicode):
                    return input.encode('utf-8')
                else:
                    return input

            full = convert(full)

            print "running"

            #article = ET.XML(xml_data)

            #print article.find('AuthorList').findall('Author')

    for entry in full:
        #print entry
        keys = ['year', 'title', 'pmid', 'lastname', 'forename', 'initials', 'affiliation']
        f = open("citations.csv", "ab")
        dict_writer = csv.DictWriter(f, keys)
        dict_writer.writer.writerow(keys)
        dict_writer.writerows(entry)

    return 


fetch_abstract()