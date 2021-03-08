import os
import shutil
from glob import glob
path = "../satellite/"

dirs = glob("../satellite/*-master")
for directory in dirs:
	subdir = glob(directory + "\\*-master")[0] # There should only be one folder in this directory.
	files = glob(subdir + "\\*")
	for file in files:
		filename = file[file.rfind("\\"):];
		os.rename(file, directory + filename);
	os.rename(directory, directory[: directory.find("-master")])
	shutil.rmtree(subdir)
